package expo.modules.flowenotifications

import android.content.Context
import android.content.SharedPreferences
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

/**
 * What the native side knows about the user's budget: the daily and monthly
 * limits, how much of today and this month is gone, and what the pinned live
 * notification should show. The widgets and the live notification draw only
 * from here, so they work with Flowe closed and no Supabase session.
 *
 * The app pushes the real figures whenever it has them (every transaction
 * write); a payment answered from the shade is added on top until the next
 * app read overwrites it with the truth.
 *
 * Every write redraws all budget surfaces.
 */
object BudgetStore {
  private const val PREFS = "flowe_daily_budget"
  private const val KEY_BUDGET = "budget"
  private const val KEY_SPENT = "spent"
  private const val KEY_DATE = "date"
  private const val KEY_MONTHLY = "monthly"
  private const val KEY_SPENT_MONTH = "spent_month"
  private const val KEY_MONTH = "month"
  private const val KEY_MODE = "live_mode"
  private const val KEY_SYNCING = "syncing"
  private const val KEY_UPDATED_AT = "updated_at"
  private const val KEY_INITIALISED = "initialised"

  /** No refresh from the app for this long → widgets show "Updated Xh ago". */
  const val STALE_AFTER_MS = 60 * 60 * 1000L

  private fun prefs(context: Context): SharedPreferences =
    context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  // Stored as strings: SharedPreferences has no double, and a float would
  // turn RM 100.10 into RM 100.09999.
  private fun money(p: SharedPreferences, key: String): Double? =
    p.getString(key, null)?.toDoubleOrNull()

  fun budget(context: Context): Double? = money(prefs(context), KEY_BUDGET)?.takeIf { it > 0 }
  fun monthlyBudget(context: Context): Double? = money(prefs(context), KEY_MONTHLY)?.takeIf { it > 0 }

  /** Today's running total; zero if the stored figure belongs to another day. */
  fun spentToday(context: Context): Double {
    val p = prefs(context)
    if (p.getString(KEY_DATE, null) != today()) return 0.0
    return money(p, KEY_SPENT) ?: 0.0
  }

  /** This month's running total; zero if the stored figure belongs to another month. */
  fun spentThisMonth(context: Context): Double {
    val p = prefs(context)
    if (p.getString(KEY_MONTH, null) != thisMonth()) return 0.0
    return money(p, KEY_SPENT_MONTH) ?: 0.0
  }

  /** 'off' | 'daily' | 'monthly' | 'both' — already narrowed by the app to what the limits allow. */
  fun liveMode(context: Context): String = prefs(context).getString(KEY_MODE, "daily") ?: "daily"

  fun isSyncing(context: Context): Boolean = prefs(context).getBoolean(KEY_SYNCING, false)

  /** Epoch millis of the last figures the app pushed; 0 if never. */
  fun updatedAt(context: Context): Long = prefs(context).getLong(KEY_UPDATED_AT, 0L)

  /** False until the app has pushed anything — widgets draw their loading face. */
  fun isInitialised(context: Context): Boolean = prefs(context).getBoolean(KEY_INITIALISED, false)

  fun isStale(context: Context, now: Long = System.currentTimeMillis()): Boolean {
    val at = updatedAt(context)
    return at > 0 && now - at > STALE_AFTER_MS
  }

  fun setBudget(context: Context, budget: Double?) {
    val e = prefs(context).edit().putBoolean(KEY_INITIALISED, true)
    if (budget == null || budget <= 0) e.remove(KEY_BUDGET) else e.putString(KEY_BUDGET, budget.toString())
    e.apply()
    changed(context)
  }

  fun setMonthlyBudget(context: Context, budget: Double?) {
    val e = prefs(context).edit().putBoolean(KEY_INITIALISED, true)
    if (budget == null || budget <= 0) e.remove(KEY_MONTHLY) else e.putString(KEY_MONTHLY, budget.toString())
    e.apply()
    changed(context)
  }

  fun setSpent(context: Context, spent: Double, date: String) {
    prefs(context).edit()
      .putString(KEY_SPENT, spent.coerceAtLeast(0.0).toString())
      .putString(KEY_DATE, date)
      .putLong(KEY_UPDATED_AT, System.currentTimeMillis())
      .putBoolean(KEY_INITIALISED, true)
      .apply()
    changed(context)
  }

  fun setSpentMonth(context: Context, spent: Double, month: String) {
    prefs(context).edit()
      .putString(KEY_SPENT_MONTH, spent.coerceAtLeast(0.0).toString())
      .putString(KEY_MONTH, month)
      .putLong(KEY_UPDATED_AT, System.currentTimeMillis())
      .putBoolean(KEY_INITIALISED, true)
      .apply()
    changed(context)
  }

  fun setLiveMode(context: Context, mode: String) {
    val safe = if (mode in setOf("off", "daily", "monthly", "both")) mode else "daily"
    prefs(context).edit().putString(KEY_MODE, safe).apply()
    changed(context)
  }

  fun setSyncing(context: Context, syncing: Boolean) {
    prefs(context).edit().putBoolean(KEY_SYNCING, syncing).apply()
    // Only the live notification shows "Syncing…"; the widgets keep their figures.
    LiveBudgetNotifier.update(context)
  }

  fun snapshot(context: Context): Map<String, Any?> = mapOf(
    "budget" to budget(context),
    "spent" to spentToday(context),
    "date" to prefs(context).getString(KEY_DATE, null),
    "monthlyBudget" to monthlyBudget(context),
    "spentMonth" to spentThisMonth(context),
    "liveMode" to liveMode(context)
  )

  fun isToday(epochMillis: Long): Boolean = dayOf(epochMillis) == today()

  /** Adds an expense to today and this month, then redraws. */
  @Synchronized
  fun recordExpense(context: Context, amount: Double) {
    if (amount <= 0) return
    val p = prefs(context)
    p.edit()
      .putString(KEY_SPENT, (spentToday(context) + amount).toString())
      .putString(KEY_DATE, today())
      .putString(KEY_SPENT_MONTH, (spentThisMonth(context) + amount).toString())
      .putString(KEY_MONTH, thisMonth())
      .putBoolean(KEY_INITIALISED, true)
      .apply()
    changed(context)
  }

  /** Redraw everything that reads these figures. */
  fun changed(context: Context) {
    BudgetWidgetProvider.refresh(context)
    MonthBudgetWidgetProvider.refresh(context)
    LiveBudgetNotifier.update(context)
  }

  private fun today(): String = dayOf(System.currentTimeMillis())
  private fun thisMonth(): String = today().substring(0, 7)

  // The app's `localYMD` — local calendar day, never UTC, or a payment before
  // 08:00 in Malaysia lands on yesterday.
  private fun dayOf(epochMillis: Long): String =
    SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date(epochMillis))
}
