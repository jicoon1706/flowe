package expo.modules.flowenotifications

import android.content.Context
import android.content.Intent
import android.app.PendingIntent
import android.net.Uri
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.ForegroundColorSpan
import android.text.style.RelativeSizeSpan
import java.util.Locale

/**
 * Shared text and intent helpers for the widgets and the live notification:
 * the Flowe money style (small "RM", strong integer, muted cents) and the
 * deep links the widgets open.
 */
object WidgetText {
  fun money(value: Double): String = String.format(Locale.US, "%,.2f", value)

  /** "RM 37.60" with a smaller "RM" and muted cents. */
  fun amount(value: Double, centsColor: Int, currencyScale: Float = 0.45f): CharSequence {
    val abs = kotlin.math.abs(value)
    val whole = String.format(Locale.US, "%,d", abs.toLong())
    val cents = String.format(Locale.US, ".%02d", Math.round((abs - abs.toLong()) * 100).coerceIn(0, 99))
    val sb = SpannableStringBuilder()
    val rmStart = sb.length
    sb.append("RM ")
    sb.setSpan(RelativeSizeSpan(currencyScale), rmStart, sb.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    sb.append(whole)
    val cStart = sb.length
    sb.append(cents)
    sb.setSpan(ForegroundColorSpan(centsColor), cStart, sb.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    return sb
  }

  /** "2h ago", "45m ago". */
  fun ago(sinceMs: Long, now: Long = System.currentTimeMillis()): String {
    val mins = ((now - sinceMs) / 60000L).coerceAtLeast(1)
    return if (mins < 60) "${mins}m ago" else "${mins / 60}h ago"
  }

  /**
   * Opens a route in Flowe (expo-router deep link, scheme from app.json:
   * floweakmal://<path>). Distinct request codes keep the PendingIntents apart.
   */
  fun openPath(context: Context, path: String, requestCode: Int): PendingIntent? {
    val intent = Intent(Intent.ACTION_VIEW, Uri.parse("floweakmal://$path"))
      .setPackage(context.packageName)
      .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP)
    return PendingIntent.getActivity(
      context,
      requestCode,
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }
}
