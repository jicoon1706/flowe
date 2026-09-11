package expo.modules.flowenotifications

/**
 * The one piece of parsing the native side does: is there a ringgit figure in
 * this text, and what is the first one. Everything else about an alert (type,
 * merchant, account) is read in TypeScript, where it can be unit-tested and
 * updated without a native rebuild — see `parseTransactionNotification.ts`.
 *
 * Shared by the listener (deciding whether an alert is worth queuing) and the
 * quick-capture receiver (adding an answered expense to today's budget).
 */
object AmountText {
  /** RM 1,234.56 / RM1234.56 / MYR 12.30 / 12.30 MYR */
  private val PATTERNS = listOf(
    Regex("""(?:RM|MYR)\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)""", RegexOption.IGNORE_CASE),
    Regex("""([0-9][0-9,]*\.[0-9]{2})\s*(?:RM|MYR)""", RegexOption.IGNORE_CASE)
  )

  fun mentionsAmount(text: String): Boolean = PATTERNS.any { it.containsMatchIn(text) }

  /** The first ringgit figure in the text, as printed ("1,234.56"). */
  fun first(text: String): String? =
    PATTERNS.firstNotNullOfOrNull { it.find(text) }?.groupValues?.getOrNull(1)

  /**
   * The first ringgit figure as a number. Banks put the payment before the
   * "Available balance RM …" trailer, so first is the right one to take; the
   * app re-syncs today's real total from Supabase the next time it runs, so a
   * rare misread costs a minute of a slightly-off progress bar, not a row.
   */
  fun firstValue(text: String): Double? =
    first(text)?.replace(",", "")?.toDoubleOrNull()
}
