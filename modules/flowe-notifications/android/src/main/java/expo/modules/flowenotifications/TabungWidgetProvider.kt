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
 * Tabung 4×2 widget (p-widget-states-tabung): white surface, navy ring on a
 * light track (monochrome blues), "Saved" toward the goal. Uses the same
 * total-saved-in rule as tabung/[id] — the app computes it and pushes it.
 * Empty: "Choose" opens Accounts to pick the Tabung to follow.
 */
class TabungWidgetProvider : AppWidgetProvider() {

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
        manager.getAppWidgetIds(ComponentName(app, TabungWidgetProvider::class.java))
      } catch (e: IllegalArgumentException) {
        return
      }
      ids.forEach { render(app, manager, it) }
    }

    private fun render(context: Context, manager: AppWidgetManager, appWidgetId: Int) {
      val views = RemoteViews(context.packageName, R.layout.flowe_widget_tabung)
      val navy = ContextCompat.getColor(context, R.color.flowe_primary)
      val track = ContextCompat.getColor(context, R.color.flowe_surface_container_high)
      val muted = ContextCompat.getColor(context, R.color.flowe_on_surface_variant)
      val size = (96 * context.resources.displayMetrics.density).toInt()
      val snap = TabungStore.get(context)

      fun show(values: Boolean, empty: Boolean, loading: Boolean) {
        views.setViewVisibility(R.id.flowe_tabung_values, if (values) View.VISIBLE else View.GONE)
        views.setViewVisibility(R.id.flowe_tabung_empty, if (empty) View.VISIBLE else View.GONE)
        views.setViewVisibility(R.id.flowe_tabung_loading, if (loading) View.VISIBLE else View.GONE)
      }

      when {
        !TabungStore.isInitialised(context) -> {
          show(values = false, empty = false, loading = true)
          views.setImageViewBitmap(R.id.flowe_tabung_ring, BudgetRing.draw(size, 0, navy, track))
          views.setTextViewText(R.id.flowe_tabung_percent, "")
        }
        snap == null -> {
          show(values = false, empty = true, loading = false)
          views.setImageViewBitmap(R.id.flowe_tabung_ring, BudgetRing.draw(size, 0, navy, track))
          views.setTextViewText(R.id.flowe_tabung_percent, "")
          WidgetText.openPath(context, "home/accounts", 31)?.let { views.setOnClickPendingIntent(R.id.flowe_tabung_choose, it) }
          WidgetText.openPath(context, "home/accounts", 30)?.let { views.setOnClickPendingIntent(R.id.flowe_tabung_root, it) }
        }
        else -> {
          show(values = true, empty = false, loading = false)
          views.setImageViewBitmap(R.id.flowe_tabung_ring, BudgetRing.draw(size, snap.percent.coerceIn(0, 100), navy, track))
          views.setTextViewText(R.id.flowe_tabung_percent, "${snap.percent}%")
          views.setTextViewText(R.id.flowe_tabung_name, snap.name)
          views.setTextViewText(R.id.flowe_tabung_amount, WidgetText.amount(snap.counted, muted, 0.6f))
          views.setTextViewText(
            R.id.flowe_tabung_footer,
            if (TabungStore.isStale(context)) "Updated ${WidgetText.ago(TabungStore.updatedAt(context))}"
            else if (snap.target > 0) "of RM ${WidgetText.money(snap.target)}" else "No target yet"
          )
          views.setContentDescription(R.id.flowe_tabung_root, "${snap.name}: ${snap.percent}% of goal")
          WidgetText.openPath(context, "home/tabung/${snap.id}", 30)?.let { views.setOnClickPendingIntent(R.id.flowe_tabung_root, it) }
        }
      }

      try {
        manager.updateAppWidget(appWidgetId, views)
      } catch (e: RuntimeException) {
        // Host went away mid-update.
      }
    }
  }
}
