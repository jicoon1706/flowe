package expo.modules.flowenotifications

import android.content.ComponentName
import android.content.Intent
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class FloweNotificationsModule : Module() {

  override fun definition() = ModuleDefinition {
    Name("FloweNotifications")

    Events(EVENT_CAPTURE)

    OnCreate { instance = this@FloweNotificationsModule }
    OnDestroy { if (instance === this@FloweNotificationsModule) instance = null }

    /**
     * Whether the user has granted Flowe notification access. This can only be
     * turned on by the user in system settings — there is no permission dialog
     * for it, which is why `openSettings` exists.
     */
    Function("isPermissionGranted") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val enabled = Settings.Secure.getString(
        context.contentResolver,
        "enabled_notification_listeners"
      ) ?: return@Function false
      val component = ComponentName(context, TransactionNotificationListenerService::class.java)
      enabled.split(":").any {
        ComponentName.unflattenFromString(it)?.equals(component) == true
      }
    }

    Function("openSettings") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
        .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    Function("isEnabled") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      CaptureStore.isEnabled(context)
    }

    Function("setEnabled") { enabled: Boolean ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      CaptureStore.setEnabled(context, enabled)
    }

    Function("getWatchedPackages") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      CaptureStore.watchedPackages(context).toList()
    }

    Function("setWatchedPackages") { packages: List<String> ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      CaptureStore.setWatchedPackages(context, packages)
    }

    /** Everything captured since the app last flushed the queue. */
    Function("getCaptures") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      CaptureStore.all(context).map { it.toMap() }
    }

    Function("removeCapture") { id: String ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      CaptureStore.remove(context, id)
    }

    Function("clearCaptures") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      CaptureStore.clear(context)
    }
  }

  companion object {
    const val EVENT_CAPTURE = "onCapture"

    // The listener service runs in the same process but outside the module's
    // lifetime, so it reaches JS through this reference. Null simply means the
    // app isn't running — the capture is already queued either way.
    @Volatile
    private var instance: FloweNotificationsModule? = null

    fun emitCapture(capture: Capture) {
      instance?.let {
        try {
          it.sendEvent(EVENT_CAPTURE, capture.toMap())
        } catch (e: Exception) {
          // JS side is gone (app being torn down); the queue still has it.
        }
      }
    }
  }
}

private fun Capture.toMap(): Map<String, Any?> = mapOf(
  "id" to id,
  "packageName" to packageName,
  "title" to title,
  "text" to text,
  "postedAt" to postedAt.toDouble(),
  "chosenType" to chosenType,
  "chosenName" to chosenName
)
