package expo.modules.flowenotifications

import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager
import android.provider.Settings
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import java.security.MessageDigest
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
 *
 * Staying bound is the hard part. Android drops a listener's binding after an
 * app update, a crash, or a force-stop, and does not always bind it again even
 * though "Notification access" is still granted — from the user's side, alerts
 * simply stop being read. So the service asks to be re-bound the moment it is
 * disconnected, [ensureBound] re-binds it whenever the app starts, and on every
 * (re)connect the shade is re-read so nothing posted during the gap is lost.
 */
class TransactionNotificationListenerService : NotificationListenerService() {

  override fun onListenerConnected() {
    connected = true
    Log.i(TAG, "Listener connected")
    // Whatever the watched apps posted while the listener was unbound is still
    // sitting in the shade. Read it now rather than losing it.
    sweepShade()
  }

  override fun onListenerDisconnected() {
    connected = false
    Log.i(TAG, "Listener disconnected — requesting rebind")
    // The system dropped us (update, low memory, crash). Access is still
    // granted, so asking for the binding back is allowed and usually works.
    NotificationListenerService.requestRebind(ComponentName(this, TransactionNotificationListenerService::class.java))
  }

  override fun onNotificationPosted(sbn: StatusBarNotification) {
    handle(sbn)
  }

  /**
   * Re-reads every notification currently in the shade from a watched app.
   * [CaptureStore.claim] makes this safe to run on every connect: an alert
   * already handled is recognised by its content and post time and skipped.
   */
  private fun sweepShade() {
    val context = applicationContext
    if (!CaptureStore.isEnabled(context)) return
    val watched = CaptureStore.watchedPackages(context)
    if (watched.isEmpty()) return

    // Throws if the binding was lost between onListenerConnected and here.
    val active = try {
      activeNotifications
    } catch (e: Exception) {
      Log.w(TAG, "Could not read the shade on connect", e)
      return
    } ?: return

    active
      .filter { it.packageName in watched }
      .sortedBy { it.postTime }
      .forEach { handle(it) }
  }

  /**
   * One notification, with the process shielded from it. An exception thrown
   * from the listener kills the app process, and a dead listener is exactly the
   * "it stopped reading" failure — so no single bad notification (unreadable
   * extras, a malformed bundle) is allowed to take the service down.
   */
  private fun handle(sbn: StatusBarNotification) {
    try {
      process(sbn)
    } catch (e: Exception) {
      Log.w(TAG, "Could not read a notification from ${sbn.packageName}", e)
    }
  }

  private fun process(sbn: StatusBarNotification) {
    val context = applicationContext
    if (!CaptureStore.isEnabled(context)) return
    if (sbn.packageName !in CaptureStore.watchedPackages(context)) return

    // Ongoing notifications are progress, not outcomes — a ride in transit, a
    // download, a foreground service. The alert for the payment itself is a
    // separate, dismissible notification.
    if (sbn.isOngoing) return

    val notification = sbn.notification ?: return
    val (title, text) = NotificationText.extract(notification)
    if (title.isBlank() && text.isBlank()) return

    // A cheap amount check, only to decide whether this is worth interrupting
    // the user for. The authoritative parse (type, merchant, account) happens in
    // TypeScript — see src/utils/parseTransactionNotification.ts — because that's
    // where it can be unit-tested and updated without a native rebuild.
    val combined = "$title $text"
    if (!looksLikeTransaction(combined)) return

    // Android delivers the same alert more than once: when the source app
    // updates it, and again for everything in the shade when the listener
    // reconnects. Identity is the content, not the id — banks reuse ids freely.
    if (!CaptureStore.claim(context, fingerprint(sbn.packageName, title, text), sbn.postTime, DEDUPE_WINDOW_MS)) return

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

    QuickCaptureNotifier.post(context, capture, AmountText.first(combined))

    // An alert that names the account (last 4 digits) and a merchant we know
    // needs nobody: file it right now, app closed or not. The JS task decides;
    // anything it can't settle stays queued behind the notification above.
    AutoFileTask.start(context, capture.id)
  }

  /**
   * Whether this alert is worth waking the user for: it names a ringgit amount
   * and isn't a security code or a piece of marketing.
   *
   * Deliberately no requirement that the text *say* money moved. Banks word a
   * successful payment a dozen ways — "Transaction Alert: RM 20.00 at ZUS",
   * "DuitNow QR successful", just an amount and a merchant — and every word
   * this screen insists on is an alert some bank never sends. The TypeScript
   * parser decides what the alert means and prunes what it can't read; the
   * shade notification carries an Ignore action for anything that slips
   * through. A missed alert costs the user a transaction they never see; an
   * extra one costs them a tap.
   */
  private fun looksLikeTransaction(text: String): Boolean {
    if (!AmountText.mentionsAmount(text)) return false
    if (SECURITY.containsMatchIn(text)) return false
    if (IGNORE.any { text.contains(it, ignoreCase = true) }) return false
    if (PROMO.any { it.containsMatchIn(text) }) return false
    return true
  }

  private fun fingerprint(packageName: String, title: String, text: String): String {
    val digest = MessageDigest.getInstance("SHA-256")
      .digest("$packageName\n$title\n$text".toByteArray())
    return digest.take(12).joinToString("") { "%02x".format(it) }
  }

  companion object {
    private const val TAG = "FloweNotifications"

    /**
     * How long two identical alerts are treated as the same event. Generous
     * enough to swallow an app rewriting its notification a few seconds later,
     * short enough that two genuinely identical payments (the same amount, at
     * the same merchant, minutes apart) are both recorded.
     */
    private const val DEDUPE_WINDOW_MS = 60_000L

    /**
     * Whether the system currently holds a binding to this service. The service
     * lives in the app's process, so this is accurate whenever the app is
     * running — and false after an update or force-stop, which is exactly when
     * [ensureBound] needs to act.
     */
    @Volatile
    var connected: Boolean = false
      private set

    private fun component(context: Context) =
      ComponentName(context, TransactionNotificationListenerService::class.java)

    /**
     * Whether the user has granted Flowe notification access. This can only be
     * turned on by the user in system settings — there is no permission dialog
     * for it.
     */
    fun isAccessGranted(context: Context): Boolean {
      val enabled = Settings.Secure.getString(
        context.contentResolver,
        "enabled_notification_listeners"
      ) ?: return false
      val self = component(context)
      return enabled.split(":").any {
        ComponentName.unflattenFromString(it)?.equals(self) == true
      }
    }

    /**
     * Gets the listener bound again if access is granted but the system has let
     * the binding lapse. Called on every app start and foreground.
     *
     * Toggling the component off and on is the long-standing workaround for a
     * listener the system silently dropped: it makes the system re-evaluate
     * the enabled listeners and bind this one afresh. `requestRebind` alone is
     * ignored when the system still believes it is bound. Both are no-ops when
     * the listener is already connected, so this is cheap to call often.
     */
    fun ensureBound(context: Context) {
      if (connected) return
      if (!isAccessGranted(context)) return

      val self = component(context)
      try {
        val manager = context.packageManager
        manager.setComponentEnabledSetting(
          self,
          PackageManager.COMPONENT_ENABLED_STATE_DISABLED,
          PackageManager.DONT_KILL_APP
        )
        manager.setComponentEnabledSetting(
          self,
          PackageManager.COMPONENT_ENABLED_STATE_ENABLED,
          PackageManager.DONT_KILL_APP
        )
        NotificationListenerService.requestRebind(self)
        Log.i(TAG, "Listener was not connected — rebind requested")
      } catch (e: Exception) {
        Log.w(TAG, "Could not request a listener rebind", e)
      }
    }

    /**
     * Security codes. Word-bounded: "OTP" as a bare substring also matches a
     * payment at a hotpot restaurant.
     */
    private val SECURITY = Regex(
      """\b(?:OTP|TAC|one[\s-]?time\s+pass(?:word|code)|verification\s+code|kod\s+pengesahan|do\s+not\s+share)\b""",
      RegexOption.IGNORE_CASE
    )

    /**
     * Marketing and reminders about money that hasn't moved. Only phrases that
     * never appear in a real payment alert belong here — "available balance"
     * and "reward points" used to, and they are the trailer on half the debit
     * alerts Malaysian banks send.
     */
    private val IGNORE = listOf(
      "promo", "promosi", "discount", "diskaun", "voucher", "baucar",
      "coupon", "giveaway", "contest", "peraduan", "limited time", "shop now",
      "buy now", "apply now", "claim now", "terms apply", "t&c", "valid till",
      "valid until", "while stocks last", "when you spend", "minimum spend",
      "payment due", "due on", "due date", "minimum payment"
    )

    /** Marketing caught by shape: a hedged amount, or one that is an incentive. */
    private val PROMO = listOf(
      Regex("""\b(?:up\s*to|as\s*low\s*as|save)\s*(?:RM|MYR)\s*[0-9]""", RegexOption.IGNORE_CASE),
      Regex("""(?:RM|MYR)\s*[0-9][0-9,.]*\s*(?:off|cashback|rebate|voucher|discount|bonus|free)\b""", RegexOption.IGNORE_CASE),
      Regex("""\b(?:get|enjoy|earn|win|grab|claim|redeem)\s+(?:up\s*to\s*)?(?:RM|MYR)\s*[0-9]""", RegexOption.IGNORE_CASE),
      Regex("""[0-9]{1,3}\s*%\s*(?:off|discount|cashback|rebate)""", RegexOption.IGNORE_CASE)
    )
  }
}
