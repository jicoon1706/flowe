package expo.modules.flowenotifications

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.os.Bundle
import android.view.View
import android.widget.RemoteViews
import androidx.core.content.ContextCompat

/**
 * Budget 4×2 widget (p-widget-states-budget #2): today left and month left
 * side by side, each with a white bar on glass; "+" opens Add. A column with
 * no limit is hidden; with neither, the empty face asks for a budget.
 */
class MonthBudgetWidgetProvider : AppWidgetProvider() {

  override fun onUpdate(context: Context, manager: AppWidgetManager, appWidgetIds: IntArray) {
    appWidgetIds.forEach { render(context, manager, it) }
  }

  override fun onAppWidgetOptionsChanged(context: Context, manager: AppWidgetManager, appWidgetId: Int, newOptions: Bundle?) {
    render(context, manager, appWidgetId)
  }

  companion object {
    fun refresh(context: Context) {
      val app = context.applicationContext
      val manager = AppWidgetManager.getInstance(app) ?: return
      val ids = try {
        manager.getAppWidgetIds(ComponentName(app, MonthBudgetWidgetProvider::class.java))
      } catch (e: IllegalArgumentException) {
        return
      }
      ids.forEach { render(app, manager, it) }
    }

    private fun render(context: Context, manager: AppWidgetManager, appWidgetId: Int) {
      val views = RemoteViews(context.packageName, R.layout.flowe_widget_budget)
      val white = ContextCompat.getColor(context, R.color.flowe_on_primary)
      val glass = ContextCompat.getColor(context, R.color.flowe_glass)
      val muted = ContextCompat.getColor(context, R.color.flowe_on_primary_muted)
      val density = context.resources.displayMetrics.density
      val daily = BudgetStore.budget(context)
      val monthly = BudgetStore.monthlyBudget(context)

      fun show(values: Boolean, empty: Boolean, loading: Boolean) {
        views.setViewVisibility(R.id.flowe_budget_values, if (values) View.VISIBLE else View.GONE)
        views.setViewVisibility(R.id.flowe_budget_empty, if (empty) View.VISIBLE else View.GONE)
        views.setViewVisibility(R.id.flowe_budget_loading, if (loading) View.VISIBLE else View.GONE)
      }

      fun column(limit: Double?, spent: Double, amountId: Int, barId: Int, footerId: Int, columnId: Int, stale: Boolean) {
        if (limit == null) { views.setViewVisibility(columnId, View.GONE); return }
        views.setViewVisibility(columnId, View.VISIBLE)
        val left = limit - spent
        val used = (spent / limit).toFloat()
        views.setTextViewText(amountId, WidgetText.amount(left, muted, 0.6f))
        views.setImageViewBitmap(barId, BudgetRing.bar((120 * density).toInt(), (6 * density).toInt(), used, white, glass))
        views.setTextViewText(
          footerId,
          if (stale) "Updated ${WidgetText.ago(BudgetStore.updatedAt(context))}"
          else "of RM ${WidgetText.money(limit)} · ${if (left < 0) "used up" else "${(used * 100).toInt().coerceIn(0, 100)}%"}"
        )
      }

      when {
        !BudgetStore.isInitialised(context) -> show(values = false, empty = false, loading = true)
        daily == null && monthly == null -> {
          show(values = false, empty = true, loading = false)
          WidgetText.openPath(context, "settings/budget", 21)?.let { views.setOnClickPendingIntent(R.id.flowe_budget_set, it) }
        }
        else -> {
          show(values = true, empty = false, loading = false)
          val stale = BudgetStore.isStale(context)
          column(daily, BudgetStore.spentToday(context), R.id.flowe_budget_day_amount, R.id.flowe_budget_day_bar, R.id.flowe_budget_day_footer, R.id.flowe_budget_day, stale)
          column(monthly, BudgetStore.spentThisMonth(context), R.id.flowe_budget_month_amount, R.id.flowe_budget_month_bar, R.id.flowe_budget_month_footer, R.id.flowe_budget_month, stale)
        }
      }

      WidgetText.openPath(context, "", 20)?.let { views.setOnClickPendingIntent(R.id.flowe_budget_root, it) }
      WidgetText.openPath(context, "add-transaction", 22)?.let { views.setOnClickPendingIntent(R.id.flowe_budget_add, it) }

      try {
        manager.updateAppWidget(appWidgetId, views)
      } catch (e: RuntimeException) {
        // Host went away mid-update.
      }
    }
  }
}
