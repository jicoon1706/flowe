package expo.modules.flowenotifications

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat

/**
 * The heads-up notification Flowe raises the moment a payment is detected — the
 * "island" the user actually interacts with when Flowe isn't open.
 *
 * Canvas "push · Android heads-up": two actions. Confirm files it the way the
 * parser reads it (expense or income, suggested category) without opening
 * Flowe; Edit — like tapping the body — opens Flowe on the same detection with
 * the form prefilled. The merchant and suggested category are worked out in the
 * app (the parser is JavaScript), so the notification names the amount and the
 * alert it came from.
 */
object QuickCaptureNotifier {
  const val CHANNEL_ID = "flowe-detected-transactions"
  const val EXTRA_CAPTURE_ID = "captureId"
  const val EXTRA_TYPE = "type"
  const val KEY_NAME_INPUT = "name"

  /** Answer meaning "this isn't a transaction" (kept for captures answered by older builds). */
  const val TYPE_IGNORE = "ignore"

  /** Answer meaning "file it as parsed" — the heads-up's Confirm. */
  const val TYPE_CONFIRM = "confirm"

  fun post(context: Context, capture: Capture, amount: String?) {
    ensureChannel(context)

    val amountLabel = amount?.let { "RM $it" } ?: "A payment"
    val source = capture.title.ifBlank { capture.packageName }
    val body = "From your $source alert. Confirm to save it, or edit it first."

    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_flowe_mark)
      .setColor(ContextCompat.getColor(context, R.color.flowe_primary))
      .setContentTitle("$amountLabel detected")
      .setContentText(body)
      .setStyle(NotificationCompat.BigTextStyle().bigText(body + "\n" + capture.text))
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setCategory(Notification.CATEGORY_RECOMMENDATION)
      // Deliberately not auto-cancelling: opening Flowe on a detection isn't the
      // same as filing it. The notification stays until the transaction is
      // actually saved or dismissed, which is what cancels it.
      .setAutoCancel(false)
      .setContentIntent(openAppIntent(context, capture))
      .addAction(confirmAction(context, capture))
      .addAction(NotificationCompat.Action.Builder(0, "Edit", openAppIntent(context, capture)).build())
      .build()

    try {
      NotificationManagerCompat.from(context).notify(capture.id.hashCode(), notification)
    } catch (e: SecurityException) {
      // POST_NOTIFICATIONS not granted — the capture is still queued, so it will
      // show up in the app; there's nothing to recover here.
    }
  }

  /**
   * Confirm: recorded on the capture as [TYPE_CONFIRM]; the auto-file task then
   * files it with the parsed direction and the suggested category.
   */
  private fun confirmAction(context: Context, capture: Capture): NotificationCompat.Action {
    val intent = Intent(context, QuickCaptureReceiver::class.java).apply {
      putExtra(EXTRA_CAPTURE_ID, capture.id)
      putExtra(EXTRA_TYPE, TYPE_CONFIRM)
    }
    val pending = PendingIntent.getBroadcast(
      context,
      (capture.id + TYPE_CONFIRM).hashCode(),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
    return NotificationCompat.Action.Builder(0, "Confirm", pending).build()
  }

  /**
   * Takes the quick-capture notification back down. Called once a capture has
   * been dealt with in the app, so the shade never keeps offering to file a
   * payment that's already been filed.
   */
  fun cancel(context: Context, captureId: String) {
    NotificationManagerCompat.from(context).cancel(captureId.hashCode())
  }

  private fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = context.getSystemService(NotificationManager::class.java) ?: return
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return
    val channel = NotificationChannel(
      CHANNEL_ID,
      "Detected transactions",
      NotificationManager.IMPORTANCE_HIGH
    ).apply {
      description = "Payments Flowe spotted in your bank and e-wallet notifications"
    }
    manager.createNotificationChannel(channel)
  }

  private fun openAppIntent(context: Context, capture: Capture): PendingIntent? {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName)
      ?: return null
    launch.putExtra(EXTRA_CAPTURE_ID, capture.id)
    launch.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
    return PendingIntent.getActivity(
      context,
      capture.id.hashCode(),
      launch,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }
}
