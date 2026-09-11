package expo.modules.flowenotifications

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.util.Log
import androidx.core.app.NotificationCompat
import com.facebook.react.HeadlessJsTaskService
import com.facebook.react.bridge.Arguments
import com.facebook.react.jstasks.HeadlessJsTaskConfig

/**
 * Runs the JS that files detected payments — with no screen, while Flowe is
 * closed.
 *
 * The listener service and the quick-capture receiver have no Supabase
 * session; only the JS bundle does (persisted in AsyncStorage). So when a
 * capture is answered from the shade, or a new one arrives, this boots the
 * bundle into the `FloweAutoFile` task (see `index.js` / `autoFileTask.ts`),
 * which reads the queue, files what needs no one, and exits. If the app is
 * already running, the same task runs inside it — `allowedInForeground` is
 * true because React Native *throws* on the UI thread otherwise, and the
 * filing code de-duplicates against itself.
 *
 * Android 8+ refuses `startService` from a background process in most
 * states. A notification action grants a short exemption and a system-bound
 * notification listener usually keeps the process eligible, but when neither
 * holds, [AutoFileTask.start] falls back to `startForegroundService`, and this
 * service then shows a brief "Saving payment…" notification (a `shortService`
 * on Android 14+) for the second or two the task takes.
 */
class AutoFileTaskService : HeadlessJsTaskService() {

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.getBooleanExtra(EXTRA_FOREGROUND, false) == true) {
      promoteToForeground()
    }
    return try {
      super.onStartCommand(intent, flags, startId)
    } catch (e: Exception) {
      // A dead React host, a task refused — the queue still holds the capture
      // and the app files it on its next open. Never let this kill the process.
      Log.w(TAG, "Could not start the auto-file task", e)
      stopSelf()
      START_NOT_STICKY
    }
  }

  override fun getTaskConfig(intent: Intent?): HeadlessJsTaskConfig {
    val data = Arguments.createMap().apply {
      intent?.getStringExtra(EXTRA_CAPTURE_ID)?.let { putString("captureId", it) }
    }
    return HeadlessJsTaskConfig(TASK_KEY, data, TIMEOUT_MS, /* allowedInForeground */ true)
  }

  private fun promoteToForeground() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(NotificationManager::class.java)
    if (manager?.getNotificationChannel(CHANNEL_ID) == null) {
      manager?.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "Saving payments", NotificationManager.IMPORTANCE_MIN).apply {
          description = "Shown for a moment while a detected payment is recorded"
          setShowBadge(false)
        }
      )
    }
    val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(R.drawable.ic_flowe_budget)
      .setContentTitle("Saving payment…")
      .setPriority(NotificationCompat.PRIORITY_MIN)
      .setOngoing(true)
      .setSilent(true)
      .build()
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        startForeground(FOREGROUND_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_SHORT_SERVICE)
      } else {
        startForeground(FOREGROUND_ID, notification)
      }
    } catch (e: Exception) {
      Log.w(TAG, "Could not promote the auto-file service", e)
    }
  }

  companion object {
    private const val TAG = "FloweAutoFile"
    const val TASK_KEY = "FloweAutoFile"
    const val EXTRA_CAPTURE_ID = "captureId"
    const val EXTRA_FOREGROUND = "foreground"
    private const val CHANNEL_ID = "flowe-auto-file"
    private const val FOREGROUND_ID = 0x0AF11E
    /** Parse + a Supabase round-trip or two; well inside a shortService's 3-minute cap. */
    private const val TIMEOUT_MS = 30_000L
  }
}

/** Wakes the auto-file task from wherever a capture changes state. */
object AutoFileTask {
  private const val TAG = "FloweAutoFile"

  fun start(context: Context, captureId: String?) {
    val app = context.applicationContext
    val intent = Intent(app, AutoFileTaskService::class.java).apply {
      captureId?.let { putExtra(AutoFileTaskService.EXTRA_CAPTURE_ID, it) }
    }
    try {
      app.startService(intent)
      // Keep the CPU on until the service has picked the task up — we're
      // usually returning from a BroadcastReceiver right after this.
      HeadlessJsTaskService.acquireWakeLockNow(app)
    } catch (e: IllegalStateException) {
      // Background start refused. A foreground service is allowed from the
      // states we're called in (a notification action; a bound listener) —
      // and if even that is refused, the app files it on its next open.
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
      try {
        intent.putExtra(AutoFileTaskService.EXTRA_FOREGROUND, true)
        app.startForegroundService(intent)
        HeadlessJsTaskService.acquireWakeLockNow(app)
      } catch (e2: Exception) {
        Log.w(TAG, "Could not start the auto-file task in the background; the app will file it", e2)
      }
    } catch (e: Exception) {
      Log.w(TAG, "Could not start the auto-file task", e)
    }
  }
}
