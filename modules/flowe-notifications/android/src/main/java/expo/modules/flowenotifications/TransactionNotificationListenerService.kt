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

  private fun looksLikeTransaction(text: String): Boolean {
    if (IGNORE.any { text.contains(it, ignoreCase = true) }) return false
    return AMOUNT.containsMatchIn(text)
  }

  private fun extractAmount(text: String): String? =
    AMOUNT.find(text)?.groupValues?.getOrNull(1)

  companion object {
    private val AMOUNT = Regex("""(?:RM|MYR)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)""", RegexOption.IGNORE_CASE)
    private val IGNORE = listOf("OTP", "one-time password", "verification code", "do not share", "promo")
  }
}
