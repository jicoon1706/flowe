package expo.modules.flowenotifications

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.RemoteInput

/**
 * Handles the Expense / Income buttons on a quick-capture notification. The
 * answer is stored on the queued capture (with whatever name the user typed
 * inline) and the notification is dismissed — Flowe writes it to Supabase the
 * next time it opens, since only the app holds the signed-in session.
 */
class QuickCaptureReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val captureId = intent.getStringExtra(QuickCaptureNotifier.EXTRA_CAPTURE_ID) ?: return
    val type = intent.getStringExtra(QuickCaptureNotifier.EXTRA_TYPE) ?: return

    // "Ignore" means this alert was never a transaction, so the capture is
    // thrown away rather than answered — nothing should reach Supabase, and
    // the app shouldn't offer it again next time it opens.
    if (type == QuickCaptureNotifier.TYPE_IGNORE) {
      val ignored = CaptureStore.all(context).firstOrNull { it.id == captureId }
      CaptureStore.remove(context, captureId)
      NotificationManagerCompat.from(context).cancel(captureId.hashCode())
      // Tell the app so the in-app island drops it too, if Flowe is running.
      ignored?.let { FloweNotificationsModule.emitCapture(it) }
      return
    }

    val name = RemoteInput.getResultsFromIntent(intent)
      ?.getCharSequence(QuickCaptureNotifier.KEY_NAME_INPUT)
      ?.toString()
      ?.trim()
      ?.ifEmpty { null }

    CaptureStore.resolve(context, captureId, type, name)

    CaptureStore.all(context).firstOrNull { it.id == captureId }?.let { capture ->
      // Answering "Expense" is the moment the payment becomes real to the
      // user, so it's the moment the daily budget moves — and the widget is
      // redrawn right here, while Flowe may well be closed. Only today's
      // alerts count: one answered the next morning belongs to yesterday's
      // total. The app writes the row (and the true total) when it next runs.
      if (type == "expense" && BudgetStore.isToday(capture.postedAt)) {
        AmountText.firstValue("${capture.title} ${capture.text}")?.let { amount ->
          BudgetStore.recordExpense(context, amount)
        }
      }
      FloweNotificationsModule.emitCapture(capture)
    }

    NotificationManagerCompat.from(context).cancel(captureId.hashCode())

    // The user has answered; if the account can be worked out, the row goes
    // to Supabase now — not when they next happen to open Flowe. A tap on a
    // notification action is exactly the window Android lets a background
    // app start a service in.
    AutoFileTask.start(context, captureId)
  }
}
