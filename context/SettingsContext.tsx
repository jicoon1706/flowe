import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// --- Types ---
export interface UserProfile {
  displayName: string;
  avatar: string | null;
  financialIdentity: 'Employee' | 'Entrepreneur' | 'Investor' | 'Business Owner';
}

export interface AffirmationWord {
  id: string;
  text: string;
  category: 'Saving' | 'Investing' | 'Mindset' | 'Awareness';
}

export interface SettingsState {
  profile: UserProfile;
  security: {
    fingerprintEnabled: boolean;
    autoLockTimer: '1 min' | '5 min' | '15 min' | 'Never';
  };
  notifications: {
    cashflow: boolean;
    alert: boolean;
    expense: boolean;
    income: boolean;
    recurring: boolean;
    milestone: boolean;
    tabung: boolean;
    affirmation: boolean;
  };
  affirmations: {
    showOnHome: boolean;
    dailyReminder: string;
    categoryPreference: 'All' | 'Saving' | 'Investing' | 'Mindset' | 'Awareness';
    words: AffirmationWord[];
  };
  balanceVisible: boolean;
}

// --- Initial State ---
const INITIAL_STATE: SettingsState = {
  profile: { displayName: 'Ahmad', avatar: null, financialIdentity: 'Employee' },
  security: { fingerprintEnabled: true, autoLockTimer: '5 min' },
  notifications: {
    cashflow: true, alert: true, expense: true, income: true,
    recurring: true, milestone: true, tabung: true, affirmation: true,
  },
  affirmations: { showOnHome: true, dailyReminder: '08:00', categoryPreference: 'All', words: [] },
  balanceVisible: true,
};

// --- Action Types ---
type SettingsAction =
  | { type: 'UPDATE_PROFILE'; payload: Partial<UserProfile> }
  | { type: 'UPDATE_SECURITY'; payload: Partial<SettingsState['security']> }
  | { type: 'UPDATE_NOTIFICATIONS'; payload: Partial<SettingsState['notifications']> }
  | { type: 'UPDATE_AFFIRMATIONS'; payload: Partial<SettingsState['affirmations']> }
  | { type: 'ADD_AFFIRMATION_WORD'; payload: AffirmationWord }
  | { type: 'REMOVE_AFFIRMATION_WORD'; payload: string }
  | { type: 'SET_BALANCE_VISIBLE'; payload: boolean }
  | { type: 'RESET_ALL' };

// --- Reducer ---
function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
  switch (action.type) {
    case 'UPDATE_PROFILE':
      return { ...state, profile: { ...state.profile, ...action.payload } };
    case 'UPDATE_SECURITY':
      return { ...state, security: { ...state.security, ...action.payload } };
    case 'UPDATE_NOTIFICATIONS':
      return { ...state, notifications: { ...state.notifications, ...action.payload } };
    case 'UPDATE_AFFIRMATIONS':
      return { ...state, affirmations: { ...state.affirmations, ...action.payload } };
    case 'ADD_AFFIRMATION_WORD':
      return { ...state, affirmations: { ...state.affirmations, words: [...state.affirmations.words, action.payload] } };
    case 'REMOVE_AFFIRMATION_WORD':
      return { ...state, affirmations: { ...state.affirmations, words: state.affirmations.words.filter(w => w.id !== action.payload) } };
    case 'SET_BALANCE_VISIBLE':
      return { ...state, balanceVisible: action.payload };
    case 'RESET_ALL':
      return INITIAL_STATE;
    default:
      return state;
  }
}

// --- Context ---
interface SettingsContextValue {
  state: SettingsState;
  dispatch: React.Dispatch<SettingsAction>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

// --- Provider ---
interface SettingsProviderProps {
  children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
  const [state, dispatch] = useReducer(settingsReducer, INITIAL_STATE);
  return (
    <SettingsContext.Provider value={{ state, dispatch }}>
      {children}
    </SettingsContext.Provider>
  );
}

// --- Hook ---
export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
