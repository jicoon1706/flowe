package expo.modules.flowenotifications

import android.content.Context
import android.content.SharedPreferences
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * What the native side knows about today's budget: the ceiling the user set,
 * and how much of it is gone. This is what the home-screen widget draws.
 *
 * The listener service runs with no Supabase session, so this keeps its own
 * copy: the app pushes both figures whenever it has the real ones, and a
 * payment answered from the shade while Flowe is closed is simply added on
 * top. The next app open overwrites the total with the truth, so drift never
 * lasts longer than that.
 *
 * Every write refreshes the widget, because the widget is the only thing
 * these numbers exist for.
 */
object BudgetStore {
  private const val PREFS = "flowe_daily_budget"
  private const val KEY_BUDGET = "budget"
  private const val KEY_SPENT = "spent"
  private const val KEY_DATE = "date"

  private fun prefs(context: Context): SharedPreferences =
    context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  // Stored as strings: SharedPreferences has no double, and a float would
  // turn RM 100.10 into RM 100.09999.
  fun budget(context: Context): Double? =
    prefs(context).getString(KEY_BUDGET, null)?.toDoubleOrNull()?.takeIf { it > 0 }

  fun setBudget(context: Context, budget: Double?) {
    val editor = prefs(context).edit()
    if (budget == null || budget <= 0) editor.remove(KEY_BUDGET)
    else editor.putString(KEY_BUDGET, budget.toString())
    editor.apply()
    // No budget doesn't mean nothing to show — the widget falls back to its
    // "set a budget" face rather than going blank.
    BudgetWidgetProvider.refresh(context)
  }

  fun setSpent(context: Context, spent: Double, date: String) {
    prefs(context).edit()
      .putString(KEY_SPENT, spent.coerceAtLeast(0.0).toString())
      .putString(KEY_DATE, date)
      .apply()
    BudgetWidgetProvider.refresh(context)
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
   * Adds an expense to today and redraws. Unlike the old live update this
   * runs with or without a budget set: the figure is worth keeping either
   * way, so the ring is right the moment a budget appears.
   */
  @Synchronized
  fun recordExpense(context: Context, amount: Double) {
    if (amount <= 0) return
    setSpent(context, spentToday(context) + amount, today())
  }

  private fun today(): String = dayOf(System.currentTimeMillis())

  // The app's `localYMD` — local calendar day, never UTC, or a payment before
  // 08:00 in Malaysia lands on yesterday.
  private fun dayOf(epochMillis: Long): String =
    SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(epochMillis))
}
