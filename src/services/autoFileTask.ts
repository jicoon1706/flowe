import * as FloweNotifications from '../../modules/flowe-notifications';
import { authRepository } from '../repositories/auth.repository';
import { accountsRepository } from '../repositories/accounts.repository';
import { sourceAccounts } from '../lib/detectPreferences';
import { processQueue } from './autoFile';
import { refreshSpentToday } from './dailyBudget';

/** The key Android starts this under — must match `AutoFileTaskService.kt`. */
export const AUTO_FILE_TASK = 'FloweAutoFile';

/**
 * Files detected payments while Flowe is closed.
 *
 * Android runs this as a headless JS task — no UI, no navigation — when a
 * capture is answered from the notification shade, or a new one arrives. It
 * does exactly what the app does on foreground (`processQueue`): anything it
 * can read with confidence, or the user has already answered and the account
 * is known, is written to Supabase right now. Anything else stays queued for
 * the "needs your input" list the next time the app opens.
 *
 * Nothing here may throw: an unhandled error in a headless task is logged by
 * React Native as a soft exception, but the queue must survive it, so every
 * failure simply leaves the capture where it was.
 */
export async function autoFileTask(data: { captureId?: string } = {}): Promise<void> {
  try {
    if (!FloweNotifications.isAvailable || !FloweNotifications.isEnabled()) return;

    // The persisted session is the whole reason this can work with the app
    // closed. Without one there's nothing to write as — leave the queue.
    const session = await authRepository.getSession();
    if (!session.ok || !session.data) {
      console.log('[autoFile] no session; leaving queue for the app');
      return;
    }

    const accounts = await accountsRepository.fetchAllActive();
    if (!accounts.ok) {
      console.warn('[autoFile] could not load accounts:', accounts.error);
      return;
    }
    const defaults = await sourceAccounts.all();

    const { filed, pending } = await processQueue({
      userId: session.data.user.id,
      accounts: accounts.data,
      defaults,
    });
    console.log(
      `[autoFile] ${data.captureId ? `for ${data.captureId}: ` : ''}filed ${filed.length}, ${pending.length} still need input`
    );

    // Filing moved today's spend, and nothing in this runtime is watching the
    // repository's change event — the layout that subscribes only exists while
    // the app is open. So the widget's figure is re-read from Supabase here,
    // which also corrects the optimistic bump `fileDetected` made and anything
    // a shade answer counted natively.
    if (filed.length > 0) await refreshSpentToday();
  } catch (e) {
    console.warn('[autoFile] failed; queue kept:', e);
  }
}
