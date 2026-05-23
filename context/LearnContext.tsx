import React, { createContext, useContext, useReducer, ReactNode } from 'react';

// --- Types ---
export interface LearnEntry {
  id: string;
  projectId: string;
  text: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LearnProject {
  id: string;
  name: string;
  entries: LearnEntry[];
  createdAt: Date;
  updatedAt: Date;
}

interface LearnState {
  projects: LearnProject[];
}

// --- Mock Data ---
const MOCK_PROJECTS: LearnProject[] = [
  {
    id: 'p1',
    name: 'Investing Notes',
    createdAt: new Date('2026-05-01'),
    updatedAt: new Date('2026-05-20T14:30:00'),
    entries: [
      {
        id: 'e1',
        projectId: 'p1',
        text: 'S&P 500 index funds are a great way to start investing. Low fees, broad diversification.',
        images: [],
        createdAt: new Date('2026-05-20T14:30:00'),
        updatedAt: new Date('2026-05-20T14:30:00'),
      },
    ],
  },
  {
    id: 'p2',
    name: 'Budget Tips',
    createdAt: new Date('2026-05-05'),
    updatedAt: new Date('2026-05-18T09:00:00'),
    entries: [
      {
        id: 'e2',
        projectId: 'p2',
        text: '50/30/20 rule: 50% needs, 30% wants, 20% savings and investments.',
        images: [],
        createdAt: new Date('2026-05-18T09:00:00'),
        updatedAt: new Date('2026-05-18T09:00:00'),
      },
    ],
  },
];

// --- Action Types ---
type LearnAction =
  | { type: 'ADD_PROJECT'; payload: { name: string } }
  | { type: 'DELETE_PROJECT'; payload: { id: string } }
  | { type: 'RENAME_PROJECT'; payload: { id: string; name: string } }
  | { type: 'ADD_ENTRY'; payload: { projectId: string; text: string; images?: string[] } }
  | { type: 'UPDATE_ENTRY'; payload: { projectId: string; entryId: string; text?: string; images?: string[] } }
  | { type: 'DELETE_ENTRY'; payload: { projectId: string; entryId: string } };

// --- Reducer ---
function learnReducer(state: LearnState, action: LearnAction): LearnState {
  switch (action.type) {
    case 'ADD_PROJECT': {
      const newProject: LearnProject = {
        id: `p${Date.now()}`,
        name: action.payload.name,
        entries: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return { ...state, projects: [...state.projects, newProject] };
    }
    case 'DELETE_PROJECT': {
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== action.payload.id),
      };
    }
    case 'RENAME_PROJECT': {
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.id
            ? { ...p, name: action.payload.name, updatedAt: new Date() }
            : p
        ),
      };
    }
    case 'ADD_ENTRY': {
      const newEntry: LearnEntry = {
        id: `e${Date.now()}`,
        projectId: action.payload.projectId,
        text: action.payload.text,
        images: action.payload.images ?? [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.projectId
            ? { ...p, entries: [newEntry, ...p.entries], updatedAt: new Date() }
            : p
        ),
      };
    }
    case 'UPDATE_ENTRY': {
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.projectId
            ? {
                ...p,
                entries: p.entries.map((e) =>
                  e.id === action.payload.entryId
                    ? {
                        ...e,
                        text: action.payload.text ?? e.text,
                        images: action.payload.images ?? e.images,
                        updatedAt: new Date(),
                      }
                    : e
                ),
                updatedAt: new Date(),
              }
            : p
        ),
      };
    }
    case 'DELETE_ENTRY': {
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.projectId
            ? {
                ...p,
                entries: p.entries.filter((e) => e.id !== action.payload.entryId),
                updatedAt: new Date(),
              }
            : p
        ),
      };
    }
    default:
      return state;
  }
}

// --- Context ---
interface LearnContextValue {
  state: LearnState;
  dispatch: React.Dispatch<LearnAction>;
}

const LearnContext = createContext<LearnContextValue | null>(null);

// --- Provider ---
interface LearnProviderProps {
  children: ReactNode;
}

export function LearnProvider({ children }: LearnProviderProps) {
  const [state, dispatch] = useReducer(learnReducer, { projects: MOCK_PROJECTS });
  return (
    <LearnContext.Provider value={{ state, dispatch }}>
      {children}
    </LearnContext.Provider>
  );
}

// --- Hook ---
export function useLearn(): LearnContextValue {
  const context = useContext(LearnContext);
  if (!context) {
    throw new Error('useLearn must be used within a LearnProvider');
  }
  return context;
}