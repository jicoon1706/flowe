import { useCallback, useState } from 'react';
import { completeOnboarding } from '../services/onboarding';
import type { DraftAccount } from '../types/onboarding';

/** Wraps completeOnboarding with a busy flag for the onboarding screens. */
export function useCompleteOnboarding() {
  const [saving, setSaving] = useState(false);
  const complete = useCallback(async (name: string, drafts: DraftAccount[]) => {
    setSaving(true);
    const res = await completeOnboarding(name, drafts);
    setSaving(false);
    return res;
  }, []);
  return { saving, complete };
}
