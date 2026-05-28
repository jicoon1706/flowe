# Flowe — Architecture

Flowe is an Expo (React Native) personal finance app with a Supabase backend (Auth, PostgreSQL + RLS, Edge Functions, Storage). The client follows strict layering: **Screen → Hook → Repository/Service → Supabase client**. Components never touch Supabase directly.

## 1. High-Level System Architecture

```mermaid
graph TB
    subgraph Device["📱 Mobile App (Expo / React Native)"]
        subgraph FE["FRONTEND"]
            Screens["Screens (expo-router)<br/>app/(auth) · (onboarding) · (main)"]
            Comps["UI Components<br/>components/ · src/components/ui/"]
            Ctx["React Context<br/>Auth · Onboarding · Settings · Learn · TabBar"]
        end
        subgraph DAL["DATA / LOGIC LAYER"]
            Hooks["Custom Hooks<br/>useTransactions, useCashflow, useAccounts…"]
            Repos["Repositories<br/>transactions, accounts, assets…"]
            Svcs["Services<br/>edgeFunctions · storage"]
        end
        subgraph Local["DEVICE STORAGE"]
            Secure["expo-secure-store<br/>PIN hash, flags"]
            Async["AsyncStorage<br/>Supabase session"]
        end
        SB["src/lib/supabase.ts<br/>(Supabase client)"]
    end

    subgraph Cloud["☁️ Supabase Backend"]
        Auth["Auth<br/>(anon + email/pw)"]
        DB[("PostgreSQL<br/>+ Row Level Security")]
        Edge["Edge Functions<br/>cashflow-summary · analysis-monthly"]
        Store["Storage Buckets<br/>avatars · receipts · learn-images"]
    end

    Screens --> Comps
    Screens --> Ctx
    Screens --> Hooks
    Ctx --> Repos
    Hooks --> Repos
    Hooks --> Svcs
    Repos --> SB
    Svcs --> SB
    Ctx --> SB
    SB --> Auth
    SB --> DB
    SB --> Edge
    SB --> Store
    Edge --> DB
    Auth -.session.-> Async
    Ctx -.PIN/flags.-> Secure
```

## 2. Frontend — Routing & Auth Gate

```mermaid
graph TB
    Root["app/_layout.tsx<br/>RootLayout + Auth Gate"]
    Root -->|"!pinSet"| AuthG["(auth)"]
    Root -->|"pinSet & !onboardingDone"| OnbG["(onboarding)"]
    Root -->|"ready"| MainG["(main)"]

    subgraph AuthGroup["(auth) — PIN setup"]
        welcome --> createpin["create-pin"] --> confirmpin["confirm-pin"] --> fingerprint --> success
    end

    subgraph OnbGroup["(onboarding)"]
        name --> accounts["accounts (bank/wallet/tabung)"]
    end

    subgraph MainGroup["(main) — protected app"]
        Home["index / home"]
        Tx["add-transaction"]
        Cash["cashflow/"]
        Cal["calendar"]
        Analysis["home/analysis"]
        Tabung["tabung/ · home/tabung/[id]"]
        Learn["home/learn/…"]
        Settings["settings/…"]
        Notif["home/notifications"]
    end

    AuthG --> AuthGroup
    OnbG --> OnbGroup
    MainG --> MainGroup
```

## 3. Backend / API — Data Flow & Layering

```mermaid
flowchart LR
    subgraph Client["App Layers"]
        C["Component / Screen"] --> H["Hook<br/>(state + loading + error)"]
        H --> R["Repository<br/>(Result&lt;T,Error&gt;)"]
        H --> S["Service"]
    end

    R -->|"CRUD .from(table)"| DB
    S -->|"functions.invoke()"| EF
    S -->|"storage.upload / signedUrl"| ST

    subgraph Supabase["Supabase"]
        AUTH["Auth: signInAnonymously<br/>signIn / signUp / session"]
        DB[("Postgres tables<br/>transactions, accounts,<br/>bank/tabung/wallet_accounts,<br/>assets, liabilities, recurring_rules,<br/>learn_*, notifications, affirmations,<br/>settings, custom_categories, auth_config")]
        EF["Edge Functions<br/>cashflow-summary → net worth, income stmt<br/>analysis-monthly → charts, breakdown"]
        ST["Buckets (private, RLS)<br/>avatars · receipts · learn-images"]
    end

    AUTH -. "auth.uid()" .-> RLS{{"RLS scopes<br/>every query"}}
    RLS --- DB
    EF --> DB
```

## Key architectural notes

- **Strict layering:** Screen → Hook → Repository/Service → `supabase` client (`src/lib/supabase.ts`). Components never call Supabase directly.
- **Result pattern:** repositories/services return `Result<T, Error>` instead of throwing; hooks unwrap into `{ data, loading, error }` (e.g. `src/hooks/useTransactions.ts`).
- **API surface = 2 kinds:** direct table CRUD via PostgREST (repositories) + 2 Edge Functions for computed aggregates (`src/services/edgeFunctions.ts`).
- **Security:** all DB access is RLS-scoped to `auth.uid()`; private buckets use time-limited signed URLs (`src/services/storage.ts`). Local PIN hash + flags live in `expo-secure-store`; the Supabase session is persisted in `AsyncStorage`.
- **Auth gate** in `app/_layout.tsx` drives three route groups: `(auth)` PIN setup → `(onboarding)` → `(main)`, with anonymous sign-in as the default session.
