package expo.modules.flowenotifications

import android.content.Context
import org.json.JSONObject

/**
 * The Tabung the 4×2 widget follows, as the app last computed it (the same
 * "total saved in" rule as tabung/[id]). Null = the widget's "Choose" face.
 */
object TabungStore {
  private const val PREFS = "flowe_tabung_widget"
  private const val KEY_JSON = "json"
  private const val KEY_UPDATED_AT = "updated_at"
  private const val KEY_INITIALISED = "initialised"

  data class Snapshot(
    val id: String,
    val name: String,
    val counted: Double,
    val target: Double,
    val balance: Double,
    val percent: Int
  )

  private fun prefs(context: Context) =
    context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun set(context: Context, json: String?) {
    val e = prefs(context).edit().putBoolean(KEY_INITIALISED, true).putLong(KEY_UPDATED_AT, System.currentTimeMillis())
    if (json == null) e.remove(KEY_JSON) else e.putString(KEY_JSON, json)
    e.apply()
    TabungWidgetProvider.refresh(context)
  }

  fun isInitialised(context: Context): Boolean = prefs(context).getBoolean(KEY_INITIALISED, false)

  fun updatedAt(context: Context): Long = prefs(context).getLong(KEY_UPDATED_AT, 0L)

  fun isStale(context: Context, now: Long = System.currentTimeMillis()): Boolean {
    val at = updatedAt(context)
    return at > 0 && now - at > BudgetStore.STALE_AFTER_MS
  }

  fun get(context: Context): Snapshot? {
    val raw = prefs(context).getString(KEY_JSON, null) ?: return null
    return try {
      val o = JSONObject(raw)
      Snapshot(
        id = o.getString("id"),
        name = o.getString("name"),
        counted = o.optDouble("counted", 0.0),
        target = o.optDouble("target", 0.0),
        balance = o.optDouble("balance", 0.0),
        percent = o.optInt("percent", 0)
      )
    } catch (e: Exception) {
      null
    }
  }
}
