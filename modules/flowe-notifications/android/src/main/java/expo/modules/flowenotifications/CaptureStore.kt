package expo.modules.flowenotifications

import android.content.Context
import android.content.SharedPreferences
import org.json.JSONArray
import org.json.JSONObject

/**
 * A capture is one bank/e-wallet notification Flowe thinks is a transaction.
 *
 * Captures are held on device until the JS side has written them to Supabase.
 * The listener service runs without the app (and without a signed-in session),
 * so this queue is what lets a detection survive until Flowe next opens.
 */
data class Capture(
  val id: String,
  val packageName: String,
  val title: String,
  val text: String,
  val postedAt: Long,
  /** Set when the user answered the quick-capture notification without opening Flowe. */
  val chosenType: String? = null,
  val chosenName: String? = null
) {
  fun toJson(): JSONObject = JSONObject().apply {
    put("id", id)
    put("packageName", packageName)
    put("title", title)
    put("text", text)
    put("postedAt", postedAt)
    chosenType?.let { put("chosenType", it) }
    chosenName?.let { put("chosenName", it) }
  }

  companion object {
    fun fromJson(json: JSONObject) = Capture(
      id = json.getString("id"),
      packageName = json.optString("packageName"),
      title = json.optString("title"),
      text = json.optString("text"),
      postedAt = json.optLong("postedAt"),
      chosenType = json.optString("chosenType").ifEmpty { null },
      chosenName = json.optString("chosenName").ifEmpty { null }
    )
  }
}

object CaptureStore {
  private const val PREFS = "flowe_notification_captures"
  private const val KEY_QUEUE = "queue"
  private const val KEY_ENABLED = "enabled"
  private const val KEY_PACKAGES = "packages"

  // Bounded so a runaway notification source can't grow the queue without limit
  // while the app sits unopened.
  private const val MAX_QUEUE = 100

  private fun prefs(context: Context): SharedPreferences =
    context.applicationContext.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

  fun isEnabled(context: Context): Boolean = prefs(context).getBoolean(KEY_ENABLED, false)

  fun setEnabled(context: Context, enabled: Boolean) {
    prefs(context).edit().putBoolean(KEY_ENABLED, enabled).apply()
  }

  fun watchedPackages(context: Context): Set<String> =
    prefs(context).getStringSet(KEY_PACKAGES, emptySet()) ?: emptySet()

  fun setWatchedPackages(context: Context, packages: List<String>) {
    prefs(context).edit().putStringSet(KEY_PACKAGES, packages.toSet()).apply()
  }

  @Synchronized
  fun all(context: Context): List<Capture> {
    val raw = prefs(context).getString(KEY_QUEUE, null) ?: return emptyList()
    return try {
      val array = JSONArray(raw)
      (0 until array.length()).map { Capture.fromJson(array.getJSONObject(it)) }
    } catch (e: Exception) {
      emptyList()
    }
  }

  @Synchronized
  private fun write(context: Context, captures: List<Capture>) {
    val array = JSONArray()
    captures.takeLast(MAX_QUEUE).forEach { array.put(it.toJson()) }
    prefs(context).edit().putString(KEY_QUEUE, array.toString()).apply()
  }

  @Synchronized
  fun add(context: Context, capture: Capture) {
    write(context, all(context) + capture)
  }

  @Synchronized
  fun remove(context: Context, id: String) {
    write(context, all(context).filterNot { it.id == id })
  }

  @Synchronized
  fun clear(context: Context) {
    write(context, emptyList())
  }

  /** Record the answer the user gave from the quick-capture notification. */
  @Synchronized
  fun resolve(context: Context, id: String, type: String, name: String?) {
    write(
      context,
      all(context).map {
        if (it.id == id) it.copy(chosenType = type, chosenName = name) else it
      }
    )
  }
}
