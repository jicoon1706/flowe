import { onboardingReducer, initialOnboardingState } from '../context/OnboardingContext';

describe('onboardingReducer', () => {
  it('sets pin', () => {
    const s = onboardingReducer(initialOnboardingState, { type: 'SET_PIN', pin: '123456' });
    expect(s.pin).toBe('123456');
  });

  it('clears pin', () => {
    const s = onboardingReducer({ ...initialOnboardingState, pin: 'x' }, { type: 'CLEAR_PIN' });
    expect(s.pin).toBeNull();
  });

  it('adds and removes draft accounts', () => {
    const draft = { kind: 'wallet' as const, name: 'Cash', openingBalance: 50 };
    const s1 = onboardingReducer(initialOnboardingState, { type: 'ADD_DRAFT', draft });
    expect(s1.draftAccounts).toHaveLength(1);
    const s2 = onboardingReducer(s1, { type: 'REMOVE_DRAFT', index: 0 });
    expect(s2.draftAccounts).toHaveLength(0);
  });

  it('sets name and fingerprint flag', () => {
    let s = onboardingReducer(initialOnboardingState, { type: 'SET_NAME', name: 'Ahmad' });
    expect(s.name).toBe('Ahmad');
    s = onboardingReducer(s, { type: 'SET_FINGERPRINT', enabled: true });
    expect(s.fingerprintEnabled).toBe(true);
  });
});