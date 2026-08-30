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
import androidx.core.app.RemoteInput

/**
 * The heads-up notification Flowe raises the moment a payment is detected — the
 * "island" the user actually interacts with when Flowe isn't open.
 *
 * It carries two one-tap actions (Expense / Income) and an inline text field for
 * the name, so a transaction can be filed straight from the shade. Tapping the
 * body instead opens Flowe on the same detection with the form prefilled.
 */
object QuickCaptureNotifier {
  const val CHANNEL_ID = "flowe-detected-transactions"
  const val EXTRA_CAPTURE_ID = "captureId"
  const val EXTRA_TYPE = "type"
  const val KEY_NAME_INPUT = "name"

  fun post(context: Context, capture: Capture, amount: String?) {
    ensureChannel(context)

    val amountLabel = amount?.let { "RM $it" } ?: "A payment"
    val source = capture.title.ifBlank { capture.packageName }

    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_menu_save)
      .setContentTitle("$amountLabel detected")
      .setContentText("From $source — tap to save it in Flowe")
      .setStyle(NotificationCompat.BigTextStyle().bigText(capture.text))
      .setPriority(NotificationCompat.PRIORITY_HIGH)
      .setCategory(Notification.CATEGORY_RECOMMENDATION)
      .setAutoCancel(true)
      .setContentIntent(openAppIntent(context, capture))
      .addAction(action(context, capture, "expense", "Expense"))
      .addAction(action(context, capture, "income", "Income"))
      .build()

    try {
      NotificationManagerCompat.from(context).notify(capture.id.hashCode(), notification)
    } catch (e: SecurityException) {
      // POST_NOTIFICATIONS not granted — the capture is still queued, so it will
      // show up in the app; there's nothing to recover here.
    }
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

  /**
   * An Expense/Income action carrying an inline "name" field. Answering here
   * records the choice on the queued capture; Flowe posts it to Supabase the
   * next time it runs, so the user never has to open the app to log a payment.
   */
  private fun action(context: Context, capture: Capture, type: String, label: String): NotificationCompat.Action {
    val intent = Intent(context, QuickCaptureReceiver::class.java).apply {
      putExtra(EXTRA_CAPTURE_ID, capture.id)
      putExtra(EXTRA_TYPE, type)
    }
    val pending = PendingIntent.getBroadcast(
      context,
      (capture.id + type).hashCode(),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
    )
    val remoteInput = RemoteInput.Builder(KEY_NAME_INPUT)
      .setLabel("What was it for?")
      .build()

    return NotificationCompat.Action.Builder(0, label, pending)
      .addRemoteInput(remoteInput)
      .setAllowGeneratedReplies(false)
      .build()
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
