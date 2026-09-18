package expo.modules.flowenotifications

import android.content.Intent
import android.content.pm.PackageManager
import android.provider.Settings
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class FloweNotificationsModule : Module() {

  override fun definition() = ModuleDefinition {
    Name("FloweNotifications")

    Events(EVENT_CAPTURE)

    OnCreate {
      instance = this@FloweNotificationsModule
      // App start is the one moment we know a dropped listener can be
      // reclaimed: after an update or a force-stop the system doesn't rebind
      // it on its own, and the user's first sign is alerts going unread.
      appContext.reactContext?.let { TransactionNotificationListenerService.ensureBound(it) }
    }
    OnDestroy { if (instance === this@FloweNotificationsModule) instance = null }

    /**
     * Whether the user has granted Flowe notification access. This can only be
     * turned on by the user in system settings — there is no permission dialog
     * for it, which is why `openSettings` exists.
     */
    Function("isPermissionGranted") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      TransactionNotificationListenerService.isAccessGranted(context)
    }

    /**
     * Whether the system is actually delivering notifications to the listener
     * right now. Access can be granted and this still be false — that gap is
     * the whole "it stopped reading" bug — so the UI reads both.
     */
    Function("isListenerConnected") {
      TransactionNotificationListenerService.connected
    }

    /** Reclaims the listener binding if access is granted but it has lapsed. */
    Function("ensureListenerBound") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      TransactionNotificationListenerService.ensureBound(context)
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

    /**
     * Of the packages asked about, the ones actually installed on this phone.
     * Only the apps declared in the module manifest's `<queries>` block are
     * visible to us on Android 11+, which is exactly the supported source list.
     */
    Function("getInstalledPackages") { packages: List<String> ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val manager = context.packageManager
      packages.filter { pkg ->
        try {
          manager.getPackageInfo(pkg, 0)
          true
        } catch (e: PackageManager.NameNotFoundException) {
          false
        }
      }
    }

    /** Everything captured since the app last flushed the queue. */
    Function("getCaptures") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      CaptureStore.all(context).map { it.toMap() }
    }

    /**
     * Drops a capture once the app has dealt with it, and pulls its shade
     * notification down with it — the two are the same offer, so neither should
     * outlive the other.
     */
    Function("removeCapture") { id: String ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      CaptureStore.remove(context, id)
      QuickCaptureNotifier.cancel(context, id)
    }

    Function("clearCaptures") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      CaptureStore.all(context).forEach { QuickCaptureNotifier.cancel(context, it.id) }
      CaptureStore.clear(context)
    }

    // ── Daily budget widget ───────────────────────────────────────────────
    // The app owns the real figures (Supabase); these keep the native copy the
    // widget draws from and the shade receiver adds to when Flowe isn't
    // running. Every setter redraws the widget on its way out.

    /** Null clears the budget; the widget falls back to its "set one" face. */
    Function("setDailyBudget") { budget: Double? ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      BudgetStore.setBudget(context, budget)
    }

    Function("setSpentToday") { spent: Double, date: String ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      BudgetStore.setSpent(context, spent, date)
    }

    Function("getBudgetSnapshot") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      BudgetStore.snapshot(context)
    }

    /** Adds an expense to today's total and redraws the widget. */
    Function("recordBudgetExpense") { amount: Double ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      BudgetStore.recordExpense(context, amount)
    }

    /** Redraws from whatever is stored — for a foreground, or after a manual edit. */
    Function("refreshBudgetWidget") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      BudgetWidgetProvider.refresh(context)
    }

    /** Whether the user has actually placed the widget on their home screen. */
    Function("isBudgetWidgetPinned") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      BudgetWidgetProvider.isPinned(context)
    }

    /** Whether this launcher accepts an in-app "add this widget" request. */
    Function("canRequestBudgetWidget") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      BudgetWidgetProvider.canRequestPin(context)
    }

    /**
     * Asks the launcher to offer the widget for placement. The user still
     * decides; false means the launcher wouldn't even ask.
     */
    Function("requestBudgetWidget") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      BudgetWidgetProvider.requestPin(context)
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
