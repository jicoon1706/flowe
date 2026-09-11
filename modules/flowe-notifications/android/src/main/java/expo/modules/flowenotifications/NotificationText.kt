package expo.modules.flowenotifications

import android.app.Notification
import androidx.core.app.NotificationCompat

/**
 * Pulls the human-readable words out of a notification, whatever style the
 * posting app used.
 *
 * Reading only `EXTRA_TEXT` misses a lot: an InboxStyle alert keeps its body in
 * `EXTRA_TEXT_LINES`, a MessagingStyle one in its message list, and some banks
 * put the amount in the sub-text or only in the ticker. Every one of those
 * looked, to the old listener, like an empty notification — which is what the
 * user experiences as "it didn't read it".
 */
internal object NotificationText {
  data class Parts(val title: String, val text: String)

  fun extract(notification: Notification): Parts {
    // `extras` unparcels the whole bundle. Some apps stash their own Parcelable
    // classes in there, which this process can't load — that throws, and an
    // exception here must never take the listener down with it.
    val extras = try {
      notification.extras
    } catch (e: RuntimeException) {
      null
    }

    val title = firstNonBlank(
      extras?.getCharSequence(Notification.EXTRA_TITLE),
      extras?.getCharSequence(Notification.EXTRA_TITLE_BIG),
      extras?.getCharSequence(Notification.EXTRA_CONVERSATION_TITLE)
    )

    val pieces = mutableListOf<String>()
    fun add(value: CharSequence?) {
      val clean = value?.toString()?.trim().orEmpty()
      if (clean.isNotEmpty()) pieces += clean
    }

    add(extras?.getCharSequence(Notification.EXTRA_BIG_TEXT))
    add(extras?.getCharSequence(Notification.EXTRA_TEXT))
    extras?.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)?.forEach { add(it) }
    messages(notification).forEach { add(it) }
    add(extras?.getCharSequence(Notification.EXTRA_SUB_TEXT))
    add(extras?.getCharSequence(Notification.EXTRA_INFO_TEXT))
    add(extras?.getCharSequence(Notification.EXTRA_SUMMARY_TEXT))
    add(notification.tickerText)

    // BigText usually repeats Text, and the ticker repeats both. Keep each
    // distinct piece once, dropping any that is just a fragment of another.
    val distinct = pieces
      .distinct()
      .filter { piece -> pieces.none { other -> other != piece && other.contains(piece) } }

    return Parts(title = title, text = distinct.joinToString("\n"))
  }

  private fun messages(notification: Notification): List<String> = try {
    NotificationCompat.MessagingStyle.extractMessagingStyleFromNotification(notification)
      ?.messages
      ?.mapNotNull { it.text?.toString() }
      .orEmpty()
  } catch (e: RuntimeException) {
    emptyList()
  }

  private fun firstNonBlank(vararg values: CharSequence?): String =
    values.firstOrNull { !it.isNullOrBlank() }?.toString()?.trim().orEmpty()
}
