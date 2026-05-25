import { createContext, useContext, useReducer, ReactNode } from 'react';
import type { DraftAccount } from '../src/types/onboarding';

export type OnboardingState = {
  pin: string | null;
  fingerprintEnabled: boolean;
  name: string;
  draftAccounts: DraftAccount[];
};

export const initialOnboardingState: OnboardingState = {
  pin: null,
  fingerprintEnabled: false,
  name: '',
  draftAccounts: [],
};

type Action =
  | { type: 'SET_PIN'; pin: string }
  | { type: 'CLEAR_PIN' }
  | { type: 'SET_FINGERPRINT'; enabled: boolean }
  | { type: 'SET_NAME'; name: string }
  | { type: 'ADD_DRAFT'; draft: DraftAccount }
  | { type: 'REMOVE_DRAFT'; index: number }
  | { type: 'RESET' };

export function onboardingReducer(state: OnboardingState, action: Action): OnboardingState {
  switch (action.type) {
    case 'SET_PIN': return { ...state, pin: action.pin };
    case 'CLEAR_PIN': return { ...state, pin: null };
    case 'SET_FINGERPRINT': return { ...state, fingerprintEnabled: action.enabled };
    case 'SET_NAME': return { ...state, name: action.name };
    case 'ADD_DRAFT': return { ...state, draftAccounts: [...state.draftAccounts, action.draft] };
    case 'REMOVE_DRAFT': return {
      ...state,
      draftAccounts: state.draftAccounts.filter((_, i) => i !== action.index),
    };
    case 'RESET': return initialOnboardingState;
    default: return state;
  }
}

const Ctx = createContext<{
  state: OnboardingState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(onboardingReducer, initialOnboardingState);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useOnboarding() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useOnboarding must be inside OnboardingProvider');
  return v;
}