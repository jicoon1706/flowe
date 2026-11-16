package expo.modules.flowenotifications

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.os.Build
import android.os.Bundle
import android.view.View
import android.widget.RemoteViews
import androidx.core.content.ContextCompat

/**
 * "Left today" 2×2 widget (p-widget-states-budget #1): gradient field, the
 * figure left today, a white bar on glass and "of RM 200.00 · 81%".
 *
 * Faces: loading (nothing pushed yet), empty (no daily budget → "Set budget"),
 * stale (no refresh from the app for an hour → "Updated 2h ago") and normal.
 * Tapping opens Home, which re-reads today's spend. All state comes from
 * [BudgetStore]; colours come from res/values/flowe_tokens.xml.
 */
class BudgetWidgetProvider : AppWidgetProvider() {

  override fun onUpdate(context: Context, manager: AppWidgetManager, appWidgetIds: IntArray) {
    appWidgetIds.forEach { render(context, manager, it) }
  }

  override fun onAppWidgetOptionsChanged(context: Context, manager: AppWidgetManager, appWidgetId: Int, newOptions: Bundle?) {
    render(context, manager, appWidgetId)
  }

  companion object {
    /** Redraws every instance the user has placed. Cheap, and a no-op when there are none. */
    fun refresh(context: Context) {
      val app = context.applicationContext
      val manager = AppWidgetManager.getInstance(app) ?: return
      val ids = try {
        manager.getAppWidgetIds(ComponentName(app, BudgetWidgetProvider::class.java))
      } catch (e: IllegalArgumentException) {
        return
      }
      ids.forEach { render(app, manager, it) }
    }

    fun isPinned(context: Context): Boolean {
      val app = context.applicationContext
      val manager = AppWidgetManager.getInstance(app) ?: return false
      return try {
        manager.getAppWidgetIds(ComponentName(app, BudgetWidgetProvider::class.java)).isNotEmpty()
      } catch (e: IllegalArgumentException) {
        false
      }
    }

    fun canRequestPin(context: Context): Boolean {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return false
      val manager = AppWidgetManager.getInstance(context.applicationContext) ?: return false
      return manager.isRequestPinAppWidgetSupported
    }

    fun requestPin(context: Context): Boolean {
      if (!canRequestPin(context)) return false
      val app = context.applicationContext
      val manager = AppWidgetManager.getInstance(app) ?: return false
      return try {
        manager.requestPinAppWidget(ComponentName(app, BudgetWidgetProvider::class.java), null, null)
      } catch (e: Exception) {
        false
      }
    }

    private fun render(context: Context, manager: AppWidgetManager, appWidgetId: Int) {
      val views = RemoteViews(context.packageName, R.layout.flowe_widget_daily_budget)
      val white = ContextCompat.getColor(context, R.color.flowe_on_primary)
      val glass = ContextCompat.getColor(context, R.color.flowe_glass)
      val muted = ContextCompat.getColor(context, R.color.flowe_on_primary_muted)
      val budget = BudgetStore.budget(context)
      val spent = BudgetStore.spentToday(context)

      fun show(values: Boolean, empty: Boolean, loading: Boolean) {
        views.setViewVisibility(R.id.flowe_widget_values, if (values) View.VISIBLE else View.GONE)
        views.setViewVisibility(R.id.flowe_widget_empty, if (empty) View.VISIBLE else View.GONE)
        views.setViewVisibility(R.id.flowe_widget_loading, if (loading) View.VISIBLE else View.GONE)
      }

      when {
        !BudgetStore.isInitialised(context) -> show(values = false, empty = false, loading = true)
        budget == null -> {
          show(values = false, empty = true, loading = false)
          WidgetText.openPath(context, "settings/budget", 11)?.let { views.setOnClickPendingIntent(R.id.flowe_widget_set_budget, it) }
        }
        else -> {
          show(values = true, empty = false, loading = false)
          val left = budget - spent
          val over = left < 0
          val used = (spent / budget).toFloat()
          views.setTextViewText(R.id.flowe_widget_amount, WidgetText.amount(left, muted))
          views.setTextViewText(R.id.flowe_widget_caption, if (over) "over today" else "")
          views.setViewVisibility(R.id.flowe_widget_caption, if (over) View.VISIBLE else View.GONE)
          val density = context.resources.displayMetrics.density
          views.setImageViewBitmap(R.id.flowe_widget_ring, BudgetRing.bar((140 * density).toInt(), (6 * density).toInt(), used, white, glass))
          val stale = BudgetStore.isStale(context)
          views.setViewVisibility(R.id.flowe_widget_stale_icon, if (stale) View.VISIBLE else View.GONE)
          views.setTextViewText(
            R.id.flowe_widget_footer,
            if (stale) "Updated ${WidgetText.ago(BudgetStore.updatedAt(context))}"
            else "of RM ${WidgetText.money(budget)} · ${if (over) "used up" else "${(used * 100).toInt().coerceIn(0, 100)}%"}"
          )
          views.setContentDescription(
            R.id.flowe_widget_root,
            if (over) "RM ${WidgetText.money(-left)} over today's budget" else "RM ${WidgetText.money(left)} left today"
          )
        }
      }

      WidgetText.openPath(context, "", 10)?.let { views.setOnClickPendingIntent(R.id.flowe_widget_root, it) }

      try {
        manager.updateAppWidget(appWidgetId, views)
      } catch (e: RuntimeException) {
        // The widget host went away between the id lookup and the update.
      }
    }
  }
}
