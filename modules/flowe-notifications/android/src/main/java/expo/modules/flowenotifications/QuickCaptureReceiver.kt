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

    val name = RemoteInput.getResultsFromIntent(intent)
      ?.getCharSequence(QuickCaptureNotifier.KEY_NAME_INPUT)
      ?.toString()
      ?.trim()
      ?.ifEmpty { null }

    CaptureStore.resolve(context, captureId, type, name)

    CaptureStore.all(context).firstOrNull { it.id == captureId }?.let {
      FloweNotificationsModule.emitCapture(it)
    }

    NotificationManagerCompat.from(context).cancel(captureId.hashCode())
  }
}
