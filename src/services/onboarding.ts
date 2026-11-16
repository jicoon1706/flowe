import { accountsRepository, authRepository, profilesRepository } from '../repositories';
import { flags } from '../lib/secureStore';
import type { DraftAccount } from '../types/onboarding';
import type { Result, SupabaseError } from '../utils/result';

/** Creates the real account behind a draft (onboarding, or Accounts › Add). */
export async function createAccountFromDraft(userId: string, d: DraftAccount): Promise<Result<unknown, SupabaseError>> {
  if (d.kind === 'bank') {
    return accountsRepository.createBankAccount({ user_id: userId, name: d.customName ?? d.bankId, bank_name: d.bankId, account_number: d.accountLast4, opening_balance: d.openingBalance });
  }
  if (d.kind === 'wallet') return accountsRepository.createWalletAccount({ user_id: userId, name: d.name, opening_balance: d.openingBalance });
  return accountsRepository.createTabungAccount({ user_id: userId, name: d.name, icon: d.icon, template_type: d.templateType, target_amount: d.target, from_date: d.fromDate, to_date: d.toDate, linked_bank_id: d.linkedBankId, starting_amount: d.startingAmount });
}

/**
 * Writes the onboarding name and draft accounts, then marks onboarding done.
 * Resolves with how many accounts could not be created (the rest are kept).
 * Without a signed-in user (offline anonymous sign-in failed) it finishes
 * locally only, as before.
 */
export async function completeOnboarding(name: string, drafts: DraftAccount[]): Promise<Result<{ failed: number }, SupabaseError>> {
  const userRes = await authRepository.getUser();
  let failed = 0;
  if (userRes.ok && userRes.data) {
    const userId = userRes.data.id;
    if (name.trim()) await profilesRepository.update(userId, { display_name: name.trim() });
    for (const d of drafts) {
      const res = await createAccountFromDraft(userId, d);
      if (!res.ok) failed += 1;
    }
  }
  try {
    await flags.markOnboardingDone();
  } catch {
    return { ok: false, error: { code: 'LOCAL_STORE', message: 'Could not save on this device' } };
  }
  return { ok: true, data: { failed } };
}
