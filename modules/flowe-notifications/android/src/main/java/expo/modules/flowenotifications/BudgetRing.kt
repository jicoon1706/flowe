package expo.modules.flowenotifications

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF

/**
 * The ring the widget is built around, drawn straight to a bitmap.
 *
 * RemoteViews can't host a custom View, and its ProgressBar can't be made
 * circular with a rounded cap, so the arc is painted here and handed over with
 * `setImageViewBitmap`. It also means the ring looks identical on every
 * launcher and every Android version, which a themed ProgressBar would not.
 *
 * The arc shows what is *left*, not what is spent: the number in the middle
 * reads "RM x left", and a ring that empties as the day goes on says the same
 * thing without being read.
 */
object BudgetRing {
  /** Twelve o'clock, so the ring drains clockwise from the top. */
  private const val START_ANGLE = -90f

  /**
   * @param sizePx  side of the square bitmap; clamped, because a widget bitmap
   *                that overruns the RemoteViews transaction limit is dropped
   *                silently and the widget just shows nothing.
   * @param percent 0–100 of the budget still unspent.
   */
  fun draw(sizePx: Int, percent: Int, color: Int, trackColor: Int): Bitmap {
    val size = sizePx.coerceIn(96, 384)
    val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)

    val stroke = size * 0.105f
    val inset = stroke / 2f + size * 0.015f
    val box = RectF(inset, inset, size - inset, size - inset)

    val track = Paint(Paint.ANTI_ALIAS_FLAG).apply {
      style = Paint.Style.STROKE
      strokeWidth = stroke
      strokeCap = Paint.Cap.ROUND
      this.color = trackColor
    }
    canvas.drawArc(box, 0f, 360f, false, track)

    val remaining = percent.coerceIn(0, 100)
    if (remaining > 0) {
      val arc = Paint(track).apply { this.color = color }
      // A full ring drawn as a 360° arc with a round cap leaves a notch where
      // the ends meet, so close it as a circle instead.
      if (remaining >= 100) canvas.drawArc(box, 0f, 360f, false, arc)
      else canvas.drawArc(box, START_ANGLE, 360f * (remaining / 100f), false, arc)
    }
    return bitmap
  }
}
