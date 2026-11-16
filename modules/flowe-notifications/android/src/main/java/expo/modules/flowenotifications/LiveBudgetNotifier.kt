package expo.modules.flowenotifications

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat

/**
 * The pinned "Live budget" notification (o-android-live-update): what is left
 * today (and/or this month), a progress bar of what is used, and the month
 * line. On Android 16+ it is a ProgressStyle Live Update with a status-bar
 * chip ("RM 37 left"); below that a plain ongoing notification with a
 * progress bar.
 *
 * Redrawn from [BudgetStore] on every write, so it ticks down with each
 * payment — including one answered from the shade with Flowe closed. Over
 * budget is said in words with a full bar; never red.
 */
object LiveBudgetNotifier {
  private const val CHANNEL_ID = "flowe-live-budget"
  private const val NOTIFICATION_ID = 7310

  fun update(context: Context) {
    val app = context.applicationContext
    val manager = app.getSystemService(NotificationManager::class.java) ?: return
    val mode = BudgetStore.liveMode(app)
    val daily = BudgetStore.budget(app)
    val monthly = BudgetStore.monthlyBudget(app)
    val wantsDaily = (mode == "daily" || mode == "both") && daily != null
    val wantsMonthly = (mode == "monthly" || mode == "both") && monthly != null
    if (mode == "off" || (!wantsDaily && !wantsMonthly) || !canPost(app)) {
      manager.cancel(NOTIFICATION_ID)
      return
    }
    ensureChannel(app, manager)

    val spentDay = BudgetStore.spentToday(app)
    val spentMonth = BudgetStore.spentThisMonth(app)
    // Daily is the headline whenever it is shown; monthly takes over in "monthly" mode.
    val limit = if (wantsDaily) daily!! else monthly!!
    val spent = if (wantsDaily) spentDay else spentMonth
    val left = limit - spent
    val over = left < 0
    val usedPct = ((spent / limit) * 100).toInt().coerceIn(0, 100)
    val period = if (wantsDaily) "today" else "this month"
    val syncing = BudgetStore.isSyncing(app)

    val title = when {
      syncing -> "Syncing…"
      over -> "RM ${WidgetText.money(-left)} over ${if (wantsDaily) "today’s" else "this month’s"} budget"
      else -> "RM ${WidgetText.money(left)} left $period"
    }
    val detail = "RM ${WidgetText.money(spent)} of RM ${WidgetText.money(limit)} · ${if (over) "used up" else "$usedPct%"}"
    val monthLine = if (wantsDaily && wantsMonthly) "Month: RM ${WidgetText.money(spentMonth)} of ${WidgetText.money(monthly!!)}" else null
    val body = listOfNotNull(detail, monthLine).joinToString("\n")
    val chip = if (over) "Over" else "RM ${left.toLong()} left"
    val navy = ContextCompat.getColor(app, R.color.flowe_primary)
    val open = WidgetText.openPath(app, "", 40)

    val notification: Notification = if (Build.VERSION.SDK_INT >= 36) {
      val style = Notification.ProgressStyle()
        .setStyledByProgress(false)
        .setProgressSegments(listOf(Notification.ProgressStyle.Segment(100).setColor(navy)))
        .setProgress(usedPct)
      Notification.Builder(app, CHANNEL_ID)
        .setSmallIcon(R.drawable.ic_flowe_budget)
        .setContentTitle(title)
        .setContentText(detail)
        .setSubText("Live budget")
        .setStyle(style)
        .setShortCriticalText(chip)
        .setColor(navy)
        .setOngoing(true)
        .setOnlyAlertOnce(true)
        .setShowWhen(false)
        .setContentIntent(open)
        .setCategory(Notification.CATEGORY_STATUS)
        .build()
    } else {
      NotificationCompat.Builder(app, CHANNEL_ID)
        .setSmallIcon(R.drawable.ic_flowe_budget)
        .setContentTitle(title)
        .setContentText(detail)
        .setStyle(NotificationCompat.BigTextStyle().bigText(body))
        .setSubText("Live budget")
        .setProgress(100, usedPct, syncing)
        .setColor(navy)
        .setOngoing(true)
        .setOnlyAlertOnce(true)
        .setShowWhen(false)
        .setSilent(true)
        .setContentIntent(open)
        .setCategory(NotificationCompat.CATEGORY_STATUS)
        .setPriority(NotificationCompat.PRIORITY_LOW)
        .build()
    }

    try {
      manager.notify(NOTIFICATION_ID, notification)
    } catch (e: SecurityException) {
      // Notification permission revoked between the check and the post.
    }
  }

  fun cancel(context: Context) {
    context.applicationContext.getSystemService(NotificationManager::class.java)?.cancel(NOTIFICATION_ID)
  }

  private fun canPost(context: Context): Boolean {
    if (Build.VERSION.SDK_INT < 33) return true
    return ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
  }

  private fun ensureChannel(context: Context, manager: NotificationManager) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    if (manager.getNotificationChannel(CHANNEL_ID) != null) return
    val channel = NotificationChannel(
      CHANNEL_ID,
      context.getString(R.string.flowe_live_budget_channel),
      NotificationManager.IMPORTANCE_LOW
    ).apply {
      description = context.getString(R.string.flowe_live_budget_channel_description)
      setShowBadge(false)
    }
    manager.createNotificationChannel(channel)
  }
}
