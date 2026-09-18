package expo.modules.flowenotifications

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.widget.RemoteViews
import java.util.Locale

/**
 * Flowe's home-screen widget: a 2×2 ring showing how much of today's budget is
 * left, sitting among the user's app icons.
 *
 * It replaced the daily-budget live update, and the difference is the point —
 * a notification is gone in a minute and only appears when Flowe happens to
 * catch a payment, while this is on screen every time the phone is unlocked,
 * whether or not anything was spent.
 *
 * All of its state comes from [BudgetStore], so it draws correctly with the
 * app closed and no Supabase session anywhere in sight. Every write to that
 * store calls [refresh].
 */
class BudgetWidgetProvider : AppWidgetProvider() {

  override fun onUpdate(context: Context, manager: AppWidgetManager, appWidgetIds: IntArray) {
    appWidgetIds.forEach { render(context, manager, it) }
  }

  /** Resized, or moved to a launcher with different cells: the ring is redrawn to fit. */
  override fun onAppWidgetOptionsChanged(
    context: Context,
    manager: AppWidgetManager,
    appWidgetId: Int,
    newOptions: Bundle?
  ) {
    render(context, manager, appWidgetId)
  }

  companion object {
    private const val ACCENT = 0xFFC5FF00.toInt()
    private const val OVER = 0xFFFF4444.toInt()
    private const val TRACK = 0xFF2A2A2A.toInt()
    private const val FOREGROUND = 0xFFFFFFFF.toInt()
    private const val MUTED = 0xFFA0A0A0.toInt()

    /** Redraws every instance the user has placed. Cheap, and a no-op when there are none. */
    fun refresh(context: Context) {
      val app = context.applicationContext
      val manager = AppWidgetManager.getInstance(app) ?: return
      val ids = try {
        manager.getAppWidgetIds(ComponentName(app, BudgetWidgetProvider::class.java))
      } catch (e: IllegalArgumentException) {
        // Provider not registered (can happen mid-install); nothing to draw.
        return
      }
      ids.forEach { render(app, manager, it) }
    }

    /** Whether the user has actually put one on their home screen. */
    fun isPinned(context: Context): Boolean {
      val app = context.applicationContext
      val manager = AppWidgetManager.getInstance(app) ?: return false
      return try {
        manager.getAppWidgetIds(ComponentName(app, BudgetWidgetProvider::class.java)).isNotEmpty()
      } catch (e: IllegalArgumentException) {
        false
      }
    }

    /**
     * Whether the launcher will accept an in-app "add this widget" request.
     * Most do since Android 8; the ones that don't leave the user to the
     * long-press → Widgets route, which is why Settings says so.
     */
    fun canRequestPin(context: Context): Boolean {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return false
      val manager = AppWidgetManager.getInstance(context.applicationContext) ?: return false
      return manager.isRequestPinAppWidgetSupported
    }

    /** Asks the launcher to offer the widget for placement. False if it refused. */
    fun requestPin(context: Context): Boolean {
      if (!canRequestPin(context)) return false
      val app = context.applicationContext
      val manager = AppWidgetManager.getInstance(app) ?: return false
      return try {
        manager.requestPinAppWidget(
          ComponentName(app, BudgetWidgetProvider::class.java),
          null,
          null
        )
      } catch (e: Exception) {
        false
      }
    }

    private fun render(context: Context, manager: AppWidgetManager, appWidgetId: Int) {
      val views = RemoteViews(context.packageName, R.layout.flowe_widget_daily_budget)
      val budget = BudgetStore.budget(context)
      val spent = BudgetStore.spentToday(context)

      if (budget == null) {
        // No budget set: the widget still earns its slot by saying what to do
        // about it, rather than showing a zero that looks like a bug.
        views.setImageViewBitmap(
          R.id.flowe_widget_ring,
          BudgetRing.draw(ringSizePx(context, manager, appWidgetId), 0, ACCENT, TRACK)
        )
        views.setTextViewText(R.id.flowe_widget_amount, "—")
        views.setTextColor(R.id.flowe_widget_amount, MUTED)
        views.setTextViewText(R.id.flowe_widget_caption, "no budget")
        views.setTextViewText(R.id.flowe_widget_footer, "Set one in Flowe")
      } else {
        val remaining = budget - spent
        val over = remaining < 0
        // What's left, as a share of the budget: a full ring at the start of
        // the day, empty once it's gone.
        val left = (((budget - spent) / budget) * 100).toInt().coerceIn(0, 100)
        val color = if (over) OVER else ACCENT

        views.setImageViewBitmap(
          R.id.flowe_widget_ring,
          BudgetRing.draw(
            ringSizePx(context, manager, appWidgetId),
            // Overspent reads as a full ring in red, not an empty one — the
            // budget is blown, which is a state, not an absence.
            if (over) 100 else left,
            color,
            TRACK
          )
        )
        views.setTextViewText(R.id.flowe_widget_amount, money(if (over) -remaining else remaining))
        views.setTextColor(R.id.flowe_widget_amount, if (over) OVER else FOREGROUND)
        views.setTextViewText(R.id.flowe_widget_caption, if (over) "RM over" else "RM left")
        views.setTextViewText(R.id.flowe_widget_footer, "${money(spent)} of ${money(budget)}")
      }

      openApp(context)?.let { views.setOnClickPendingIntent(R.id.flowe_widget_root, it) }

      try {
        manager.updateAppWidget(appWidgetId, views)
      } catch (e: RuntimeException) {
        // The widget host went away between the id lookup and the update.
      }
    }

    /**
     * Side of the ring bitmap, from the cell size the launcher reports. Drawing
     * to the real size keeps the arc crisp on a stretched widget instead of
     * letting the ImageView scale a small bitmap up.
     */
    private fun ringSizePx(context: Context, manager: AppWidgetManager, appWidgetId: Int): Int {
      val options = try {
        manager.getAppWidgetOptions(appWidgetId)
      } catch (e: Exception) {
        null
      }
      val widthDp = options?.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 0) ?: 0
      val heightDp = options?.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 0) ?: 0
      val cellDp = listOf(widthDp, heightDp).filter { it > 0 }.minOrNull() ?: 110
      // Padding, the "Today" row and the footer all come out of the square the
      // ring gets; ~44dp covers them at every text size worth designing for.
      val ringDp = (cellDp - 44).coerceAtLeast(64)
      val density = context.resources.displayMetrics.density
      return (ringDp * density).toInt()
    }

    private fun openApp(context: Context): PendingIntent? {
      val launch = context.packageManager.getLaunchIntentForPackage(context.packageName) ?: return null
      launch.addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP)
      return PendingIntent.getActivity(
        context,
        0,
        launch,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
      )
    }

    private fun money(value: Double): String = String.format(Locale.US, "%,.2f", value)
  }
}
