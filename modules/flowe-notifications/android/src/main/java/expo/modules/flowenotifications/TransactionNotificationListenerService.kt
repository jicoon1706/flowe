package expo.modules.flowenotifications

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import java.util.UUID

/**
 * Listens for notifications posted by the bank and e-wallet apps the user picked
 * in Settings → Auto-detect, and queues the ones that look like a transaction.
 *
 * The service runs whether or not Flowe is open, which is the whole point: the
 * user pays with Setel, taps the Flowe notification that follows, and the
 * transaction is recorded without them opening the app. Whatever they answer is
 * written to `CaptureStore` and flushed to Supabase the next time Flowe runs
 * (only the app has the signed-in Supabase session).
 */
class TransactionNotificationListenerService : NotificationListenerService() {

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    val context = applicationContext
    if (!CaptureStore.isEnabled(context)) return

    val watched = CaptureStore.watchedPackages(context)
    if (sbn.packageName !in watched) return

    val extras = sbn.notification?.extras ?: return
    val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString().orEmpty()
    val text = (
      extras.getCharSequence(Notification.EXTRA_BIG_TEXT)
        ?: extras.getCharSequence(Notification.EXTRA_TEXT)
      )?.toString().orEmpty()

    if (title.isBlank() && text.isBlank()) return

    // A cheap amount check, only to decide whether this is worth interrupting
    // the user for. The authoritative parse (type, merchant, account) happens in
    // TypeScript — see src/utils/parseTransactionNotification.ts — because that's
    // where it can be unit-tested and updated without a native rebuild.
    val combined = "$title $text"
    if (!looksLikeTransaction(combined)) return

    // Android calls onNotificationPosted again every time the source app
    // *updates* a notification, and replays the whole shade on
    // onListenerConnected. Without this the same payment is queued and
    // announced two or three times over — the duplicate the user sees.
    // Identity is the content, not the id: banks reuse notification ids freely.
    if (isDuplicate(sbn.packageName, title, text, sbn.postTime)) return

    val capture = Capture(
      id = UUID.randomUUID().toString(),
      packageName = sbn.packageName,
      title = title,
      text = text,
      // The alert's own post time is the transaction time — it's when the
      // payment actually happened, not when Flowe got around to reading it.
      postedAt = sbn.postTime
    )
    CaptureStore.add(context, capture)

    // Tell the app if it's running, so the in-app island can appear immediately.
    FloweNotificationsModule.emitCapture(capture)

    QuickCaptureNotifier.post(context, capture, extractAmount(combined))
  }

  /**
   * True when this exact alert has already been queued moments ago.
   *
   * Two guards, because the duplicates arrive by two different routes: an
   * in-memory window catches an app editing its own notification while Flowe
   * is running, and a scan of the queue catches the shade replay that happens
   * when the listener reconnects (a fresh process has an empty window).
   */
  private fun isDuplicate(packageName: String, title: String, text: String, postedAt: Long): Boolean {
    val signature = "$packageName|$title|$text"
    val now = System.currentTimeMillis()

    synchronized(recentSignatures) {
      recentSignatures.entries.removeAll { now - it.value > DEDUPE_WINDOW_MS }
      if (recentSignatures.containsKey(signature)) return true
      recentSignatures[signature] = now
    }

    return CaptureStore.all(applicationContext).any {
      it.packageName == packageName &&
        it.title == title &&
        it.text == text &&
        kotlin.math.abs(it.postedAt - postedAt) < DEDUPE_WINDOW_MS
    }
  }

  /**
   * Whether this alert is worth waking the user for.
   *
   * An amount alone isn't enough — a promo, a fee schedule and a balance
   * reminder all name a ringgit figure — so the text must also say that money
   * moved, and must not read as marketing. This mirrors the rules in
   * src/utils/parseTransactionNotification.ts, deliberately kept a little
   * looser: TypeScript has the final say, and it can be corrected without a
   * native rebuild. Anything rejected here never becomes a notification at all,
   * which is the difference the user feels.
   */
  private fun looksLikeTransaction(text: String): Boolean {
    if (!AMOUNT.containsMatchIn(text)) return false
    if (IGNORE.any { text.contains(it, ignoreCase = true) }) return false
    if (PROMO.any { it.containsMatchIn(text) }) return false
    return MOVEMENT.containsMatchIn(text)
  }

  private fun extractAmount(text: String): String? =
    AMOUNT.find(text)?.groupValues?.getOrNull(1)

  companion object {
    /**
     * How long two identical alerts are treated as the same event. Generous
     * enough to swallow an app rewriting its notification a few seconds later,
     * short enough that two genuinely identical payments (the same amount, at
     * the same merchant, minutes apart) are both recorded.
     */
    private const val DEDUPE_WINDOW_MS = 60_000L
    private val recentSignatures = LinkedHashMap<String, Long>()

    private val AMOUNT = Regex("""(?:RM|MYR)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)""", RegexOption.IGNORE_CASE)

    /** Alerts that are never a transaction: security codes, marketing, reminders. */
    private val IGNORE = listOf(
      "OTP", "one-time password", "verification code", "do not share", "password",
      "log in", "sign in", "security alert",
      "promo", "promosi", "discount", "diskaun", "voucher", "baucar", "rebate",
      "coupon", "giveaway", "contest", "peraduan", "limited time", "shop now",
      "buy now", "apply now", "claim now", "terms apply", "t&c", "valid till",
      "valid until", "while stocks last", "reward point", "when you spend",
      "minimum spend", "interest rate",
      "payment due", "due on", "due date", "minimum payment", "outstanding balance",
      "available balance", "low balance", "e-statement", "statement is ready"
    )

    /** Marketing caught by shape: a hedged amount, or one that is an incentive. */
    private val PROMO = listOf(
      Regex("""\b(?:up\s*to|as\s*low\s*as|save)\s*(?:RM|MYR)\s*[0-9]""", RegexOption.IGNORE_CASE),
      Regex("""(?:RM|MYR)\s*[0-9][0-9,.]*\s*(?:off|cashback|rebate|voucher|discount|bonus|free)\b""", RegexOption.IGNORE_CASE),
      Regex("""\b(?:get|enjoy|earn|win|grab|claim|redeem)\s+(?:up\s*to\s*)?(?:RM|MYR)\s*[0-9]""", RegexOption.IGNORE_CASE),
      Regex("""[0-9]{1,3}\s*%\s*(?:off|discount|cashback|rebate)""", RegexOption.IGNORE_CASE)
    )

    /** A word saying money actually left or entered the user's account. */
    private val MOVEMENT = Regex(
      """\b(?:debited|debit|spent|paid|payment|purchase|withdrawn|withdrawal|deducted|charged|""" +
        """transfer(?:red)?|sent|credited|credit|received|refund(?:ed)?|deposited|reload(?:ed)?|""" +
        """topped\s*up|top[\s-]?up|transaksi|pembayaran|ditolak|diterima|masuk)\b""",
      RegexOption.IGNORE_CASE
    )
  }
}
