package expo.modules.flowenotifications

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * The daily-budget live update: "RM 45.00 left today" with a progress bar,
 * raised when a payment Flowe caught outside the app is filed as an expense,
 * and gone again a minute later.
 *
 * On Android 16+ it asks to be promoted — a Live Update pinned above the shade
 * and shown as a chip in the status bar, the way a delivery's progress is. On
 * older versions it's an ordinary progress notification with the same text.
 *
 * The listener service runs with no Supabase session, so this keeps its own
 * copy of the budget and of "today so far": the app pushes both whenever it
 * has the real figures, and a payment answered from the shade while Flowe is
 * closed is simply added on top. The next app open overwrites the total with
 * the truth, so drift never lasts longer than that.
 */
object BudgetLiveUpdate {
  const val CHANNEL_ID = "flowe-daily-budget"
  private const val NOTIFICATION_ID = 0x0B0D6E7

  /** `Notification.EXTRA_REQUEST_PROMOTED_ONGOING` — a constant only from SDK 36.1. */
  private const val EXTRA_REQUEST_PROMOTED_ONGOING = "android.requestPromotedOngoing"

  private const val PREFS = "flowe_daily_budget"
  private const val KEY_BUDGET = "budget"
  private const val KEY_SPENT = "spent"
  private const val KEY_DATE = "date"

  /**
   * How long the update stays up. Long enough to glance at after putting the
   * phone down, short enough that it never turns into a permanent fixture the
   * user learns to ignore. `setTimeoutAfter` does the cancelling; the handler
   * below is a belt-and-braces fallback for OEMs that don't honour it.
   */
  const val VISIBLE_FOR_MS = 60_000L

  private const val ACCENT = 0xFFC5FF00.toInt()
  private const val OVER = 0xFFFF4444.toInt()

  private val dismissHandler = Handler(Looper.getMainLooper())
  private var pendingDismiss: Runnable? = null

  private fun prefs(context: Context): SharedPreferences =
    context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  // Stored as strings: SharedPreferences has no double, and a float would
  // turn RM 100.10 into RM 100.09999.
  fun budget(context: Context): Double? =
    prefs(context).getString(KEY_BUDGET, null)?.toDoubleOrNull()?.takeIf { it > 0 }

  fun setBudget(context: Context, budget: Double?) {
    val editor = prefs(context).edit()
    if (budget == null || budget <= 0) {
      editor.remove(KEY_BUDGET)
      // No budget means nothing to measure against — take down whatever is up.
      dismiss(context)
    } else {
      editor.putString(KEY_BUDGET, budget.toString())
    }
    editor.apply()
  }

  fun setSpent(context: Context, spent: Double, date: String) {
    prefs(context).edit()
      .putString(KEY_SPENT, spent.coerceAtLeast(0.0).toString())
      .putString(KEY_DATE, date)
      .apply()
  }

  /** Today's running total; zero if the stored figure belongs to another day. */
  fun spentToday(context: Context): Double {
    val p = prefs(context)
    if (p.getString(KEY_DATE, null) != today()) return 0.0
    return p.getString(KEY_SPENT, null)?.toDoubleOrNull() ?: 0.0
  }

  fun snapshot(context: Context): Map<String, Any?> = mapOf(
    "budget" to budget(context),
    "spent" to spentToday(context),
    "date" to prefs(context).getString(KEY_DATE, null)
  )

  fun isToday(epochMillis: Long): Boolean = dayOf(epochMillis) == today()

  /**
   * Adds an expense to today and shows the result. A no-op without a budget:
   * the user hasn't asked to be shown anything.
   */
  @Synchronized
  fun recordExpense(context: Context, amount: Double) {
    if (amount <= 0) return
    budget(context) ?: return
    setSpent(context, spentToday(context) + amount, today())
    show(context)
  }

  @Synchronized
  fun show(context: Context) {
    val budget = budget(context) ?: return
    val spent = spentToday(context)
    ensureChannel(context)

    val remaining = budget - spent
    val over = remaining < 0
    val percent = ((spent / budget) * 100).toInt().coerceIn(0, 100)
    val color = if (over) OVER else ACCENT
    val title = if (over) "RM ${money(-remaining)} over today's budget" else "RM ${money(remaining)} left today"
    val text = "RM ${money(spent)} of RM ${money(budget)} spent"

    val notification: Notification = if (Build.VERSION.SDK_INT >= 36) {
      // Android 16: a ProgressStyle notification that asks to be promoted is
      // what the system shows as a Live Update. The chip text is what appears
      // in the status bar while it's pinned.
      //
      // Two ways of asking, because the platform changed its mind mid-release:
      // 16.0 promotes an ongoing, colorized notification with a promotable
      // style (`hasPromotableCharacteristics`), while 16 QPR (SDK 36.1) added
      // an explicit request extra and made colorization optional. The extra
      // is set by its string key so this compiles against the 36.0 SDK too.
      val style = Notification.ProgressStyle()
        .setProgress(percent)
        .setStyledByProgress(true)
        .setProgressSegments(listOf(Notification.ProgressStyle.Segment(100).setColor(color)))
      val requestPromotion = Bundle().apply { putBoolean(EXTRA_REQUEST_PROMOTED_ONGOING, true) }
      Notification.Builder(context, CHANNEL_ID)
        .setSmallIcon(R.drawable.ic_flowe_budget)
        .setColor(color)
        .setColorized(true)
        .setContentTitle(title)
        .setContentText(text)
        .setStyle(style)
        .setCategory(Notification.CATEGORY_PROGRESS)
        .setOngoing(true)
        .setOnlyAlertOnce(true)
        .setShortCriticalText(if (over) "Over" else "RM${chip(remaining)}")
        .addExtras(requestPromotion)
        .setTimeoutAfter(VISIBLE_FOR_MS)
        .setContentIntent(openApp(context))
        .build()
    } else {
      NotificationCompat.Builder(context, CHANNEL_ID)
        .setSmallIcon(R.drawable.ic_flowe_budget)
        .setColor(color)
        .setContentTitle(title)
        .setContentText(text)
        .setProgress(100, percent, false)
        .setCategory(NotificationCompat.CATEGORY_PROGRESS)
        .setPriority(NotificationCompat.PRIORITY_DEFAULT)
        .setOngoing(true)
        .setOnlyAlertOnce(true)
        .setTimeoutAfter(VISIBLE_FOR_MS)
        .setContentIntent(openApp(context))
        .build()
    }

    try {
      NotificationManagerCompat.from(context).notify(NOTIFICATION_ID, notification)
    } catch (e: SecurityException) {
      // POST_NOTIFICATIONS not granted — nothing to show, nothing to recover.
      return
    }

    // Fallback for the timeout: some OEM shells leave ongoing notifications up
    // past `setTimeoutAfter`. The process is alive while the listener is bound,
    // which is exactly when this is needed.
    pendingDismiss?.let { dismissHandler.removeCallbacks(it) }
    val appContext = context.applicationContext
    pendingDismiss = Runnable { dismiss(appContext) }.also {
      dismissHandler.postDelayed(it, VISIBLE_FOR_MS + 1_000)
    }
  }

  fun dismiss(context: Context) {
    pendingDismiss?.let { dismissHandler.removeCallbacks(it) }
    pendingDismiss = null
    NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID)
  }

  /**
   * Whether the system will actually promote the notification. Only Android
   * 16 has the switch (Settings → Notifications → Live Updates, per app);
   * below it the plain progress notification always shows, so "yes".
   */
  fun canPromote(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < 36) return true
    val manager = context.getSystemService(NotificationManager::class.java) ?: return false
    return manager.canPostPromotedNotifications()
  }

  private fun ensureChannel(context: Context) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = context.getSystemService(NotificationManager::class.java) ?: return
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return
    val channel = NotificationChannel(
      CHANNEL_ID,
      "Daily budget",
      NotificationManager.IMPORTANCE_DEFAULT
    ).apply {
      description = "How much of today's budget is left, shown briefly when a payment is recorded"
      setShowBadge(false)
    }
    manager.createNotificationChannel(channel)
  }

  private fun openApp(context: Context): PendingIntent? {
    val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null
    launch.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
    return PendingIntent.getActivity(
      context,
      NOTIFICATION_ID,
      launch,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  private fun money(value: Double): String = String.format(Locale.US, "%,.2f", value)

  /** Status-bar chip: whole ringgit once there's room to round, cents when it's tight. */
  private fun chip(value: Double): String =
    if (value >= 10) String.format(Locale.US, "%.0f", value) else String.format(Locale.US, "%.2f", value)

  private fun today(): String = dayOf(System.currentTimeMillis())

  // The app's `localYMD` — local calendar day, never UTC, or a payment before
  // 08:00 in Malaysia lands on yesterday.
  private fun dayOf(epochMillis: Long): String =
    SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(epochMillis))
}
