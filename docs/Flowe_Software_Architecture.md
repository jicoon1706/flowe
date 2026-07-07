# Flowe — Software Architecture

Flowe is a **dark-mode-only personal finance tracker** for iOS/Android, built with Expo (React Native 0.81, React 19) and backed by Supabase (Auth, PostgreSQL + Row Level Security, Edge Functions, Storage).

The client enforces a strict, one-directional layering:

> **Screen → Context/Hook → Repository/Service → Supabase client → Supabase**

UI components never import the Supabase client directly. Data-access functions return a `Result<T, E>` (never throw); hooks unwrap that into `{ data, loading, error }`.

---

## 1. System Context (C4 Level 1)

```mermaid
graph TB
    User(["👤 User<br/>(single-owner device)"])

    subgraph App["📱 Flowe Mobile App — Expo / React Native"]
        Client["expo-router screens · React Context<br/>hooks · repositories · services"]
        Local["Device storage<br/>expo-secure-store · AsyncStorage"]
    end

    subgraph Supabase["☁️ Supabase Backend"]
        Auth["Auth<br/>anonymous + email/password"]
        PG[("PostgreSQL<br/>+ Row Level Security")]
        Edge["Edge Functions (Deno)<br/>cashflow-summary · analysis-monthly"]
        Storage["Storage Buckets<br/>avatars · receipts · learn-images"]
    end

    OS["📳 OS Local Notifications<br/>expo-notifications"]

    User -->|PIN / biometric · taps| Client
    Client --> Local
    Client -->|HTTPS / PostgREST · JWT| Auth
    Client -->|CRUD via PostgREST| PG
    Client -->|functions.invoke| Edge
    Client -->|upload / signed URL| Storage
    Client --> OS
    Edge -->|RLS-scoped read| PG
    Auth -. issues JWT .-> PG
```

**Key characteristics**

- **Single-user-per-device.** A local PIN (and optional biometric) gates the app; the Supabase session is anonymous by default, so the app is usable offline-first and without an email account.
- **Two API shapes:** direct table CRUD (PostgREST via repositories) + 2 Edge Functions for computed aggregates that would be expensive/awkward on-device.
- **Security is centralized in the database.** Every table read/write is scoped to `auth.uid()` by RLS — the client cannot query another user's rows even if it tried.

---

## 2. Client Layered Architecture

```mermaid
graph TB
    subgraph L1["① Presentation — app/ · components/"]
        Screens["Screens (expo-router)<br/>(auth) · (onboarding) · (main)"]
        Comps["UI Components<br/>components/ui · home · cashflow · onboarding"]
    end

    subgraph L2["② State — context/"]
        Ctx["AuthContext · OnboardingContext<br/>SettingsContext · LockContext<br/>LearnContext · TabBarContext"]
    end

    subgraph L3["③ Logic — src/hooks/"]
        Hooks["useTransactions · useCashflow · useAccounts<br/>useAnalysis · useAssets · useLiabilities<br/>useRecurring · usePendingRecurring<br/>useNotifications · useSettings · useLearn · …"]
    end

    subgraph L4["④ Data Access — src/repositories · src/services"]
        Repos["Repositories (table CRUD)<br/>transactions · accounts · assets · liabilities<br/>recurring · notifications · settings · learn · …"]
        Svcs["Services<br/>edgeFunctions · storage · notifications · recurring"]
    end

    subgraph L5["⑤ Infrastructure — src/lib"]
        SB["supabase.ts (client)"]
        Sec["secureStore.ts (flags/PIN)"]
        Pin["pinCrypto.ts"]
    end

    Screens --> Comps
    Screens --> Ctx
    Screens --> Hooks
    Ctx --> Repos
    Ctx --> Sec
    Hooks --> Repos
    Hooks --> Svcs
    Repos --> SB
    Svcs --> SB
    Svcs --> Repos

    classDef infra fill:#2a2a2a,stroke:#C5FF00,color:#fff
    class SB,Sec,Pin infra
```

| Layer | Directory | Responsibility | Rule |
|---|---|---|---|
| Presentation | `app/`, `components/` | Screens & pure UI | May use Context + Hooks; **never** touches Supabase |
| State | `context/` | Cross-screen state (auth, lock, settings, onboarding draft) | Calls repositories |
| Logic | `src/hooks/` | Fetch/mutate + `{ data, loading, error }` | Owns loading/error state |
| Data Access | `src/repositories/`, `src/services/` | Supabase CRUD, Edge Functions, Storage | Returns `Result<T, E>`; **only** layer importing `supabase` |
| Infrastructure | `src/lib/` | Client singleton, secure store, PIN hashing | — |

---

## 3. Module Map

```mermaid
graph LR
    subgraph Features["Feature domains"]
        Tx["Transactions"]
        Acc["Accounts<br/>(bank · wallet · tabung)"]
        CF["Cashflow &<br/>Net Worth"]
        AL["Assets &<br/>Liabilities"]
        Rec["Recurring"]
        Notif["Notifications"]
        Learn["Learn projects"]
        Aff["Affirmations"]
        Set["Settings"]
    end

    Tx --> RTx["transactions.repository"]
    Acc --> RAcc["accounts.repository"]
    AL --> RAsset["assets · liabilities repos"]
    Rec --> RRec["recurring.repository"]
    Notif --> RNotif["notifications.repository"]
    Learn --> RLearn["learn.repository"]
    Aff --> RAff["affirmations.repository"]
    Set --> RSet["settings · customCategories · authConfig repos"]

    CF --> SEdge["edgeFunctions service"]
    Rec --> SRec["recurring service"]
    Notif --> SNotif["notifications service"]
    Learn --> SStore["storage service"]
    Tx --> SStore

    RTx --> DB[("Supabase")]
    RAcc --> DB
    RAsset --> DB
    RRec --> DB
    RNotif --> DB
    RLearn --> DB
    RAff --> DB
    RSet --> DB
    SEdge --> DB
    SStore --> DB
```

Repositories (13) map ~1:1 to table groups; services (4) wrap non-CRUD concerns: `edgeFunctions` (computed aggregates), `storage` (image upload + signed URLs), `notifications` (write row + fire OS banner), `recurring` (materialize due rules into transactions).

---

## 4. Routing & Auth Gate

`app/_layout.tsx` is a three-state gate driven by **local** flags (`expo-secure-store`), not by the network session. On launch it ensures an anonymous Supabase session exists, then routes:

```mermaid
stateDiagram-v2
    [*] --> loading
    loading --> auth: !pinSet
    loading --> onboarding: pinSet && !onboardingDone
    loading --> main: pinSet && onboardingDone
    loading --> error: connect failure

    error --> loading: Retry

    state auth {
        [*] --> welcome
        welcome --> create_pin
        create_pin --> confirm_pin
        confirm_pin --> fingerprint
        fingerprint --> success
    }

    state onboarding {
        [*] --> name
        name --> accounts
    }

    state main {
        [*] --> home
        home --> add_transaction
        home --> cashflow
        home --> calendar
        home --> analysis
        home --> tabung
        home --> learn
        home --> settings
        home --> notifications
    }

    auth --> onboarding: PIN set
    onboarding --> main: onboarding done
```

- **`(auth)`** — first-run PIN setup (+ optional biometric). Writes `pin_set` flag locally and `pin_hash` to both secure store and the `auth_config` table.
- **`(onboarding)`** — capture display name and initial accounts (bank / wallet / tabung). `OnboardingContext` holds the draft until committed.
- **`(main)`** — the protected app. `LockContext` re-locks on background/auto-lock timeout; `LockOverlay` demands PIN/biometric to resume.

`refreshGate()` is exported so any flow (e.g. finishing onboarding, resetting data) can force the gate to re-evaluate.

---

## 5. Data Model

```mermaid
erDiagram
    profiles ||--|| auth_config : has
    profiles ||--o{ accounts : owns
    accounts ||--o| bank_accounts : "type=bank"
    accounts ||--o| wallet_accounts : "type=wallet"
    accounts ||--o| tabung_accounts : "type=tabung"
    profiles ||--o{ transactions : records
    accounts ||--o{ transactions : "from / to"
    profiles ||--o{ recurring_rules : schedules
    recurring_rules ||--o{ transactions : materializes
    profiles ||--o{ assets : holds
    profiles ||--o{ liabilities : owes
    profiles ||--o{ notifications : receives
    profiles ||--o{ custom_categories : defines
    profiles ||--o{ settings : configures
    profiles ||--o{ learn_projects : creates
    learn_projects ||--o{ learn_entries : contains
    learn_entries ||--o{ learn_entry_images : has
    affirmations ||--o{ affirmation_favourites : "favourited by"
    profiles ||--o{ user_affirmations : writes

    accounts {
        uuid id PK
        uuid user_id FK
        enum type "bank|wallet|tabung"
        text name
        bool is_active
    }
    transactions {
        uuid id PK
        uuid user_id FK
        enum type "expense|income|transfer|tabung_topup|tabung_withdraw"
        numeric amount
        text category
        uuid from_account_id FK
        uuid to_account_id FK
        date date
        bool is_recurring
        uuid recurring_id FK
    }
    recurring_rules {
        uuid id PK
        enum frequency "monthly|weekly|yearly"
        date start_date
        date next_date
        enum status "active|paused|ended"
    }
    assets {
        uuid id PK
        enum type "real_estate|stocks|gold|…"
        numeric current_value
        numeric monthly_income
    }
    liabilities {
        uuid id PK
        enum type "mortgage|car_loan|…"
        numeric amount_owed
        numeric monthly_payment
    }
```

**Notes**

- `accounts` is a shared header; type-specific balances live in `bank_accounts.current_balance`, `wallet_accounts.current_balance`, and `tabung_accounts.saved_amount`.
- Account balances are **maintained by the client**, not the DB. Every transaction write applies a signed delta to the relevant balance table (see §6) — edits reverse the old effect before applying the new one.
- No historical net-worth table exists; the cashflow trend is reconstructed from `date_acquired` / `created_at` cutoffs inside the Edge Function (see §7).

---

## 6. Flow — Create Transaction (with balance effect)

Repositories keep account balances consistent by applying a signed delta after each write. Edits reverse the old impact, then apply the new; deletes reverse.

```mermaid
sequenceDiagram
    participant S as Screen (add-transaction)
    participant H as useTransactions
    participant R as transactions.repository
    participant DB as Supabase (PostgREST + RLS)

    S->>H: create(request)
    H->>R: create(req)
    R->>DB: INSERT transactions
    DB-->>R: row (RLS-scoped)
    Note over R: applyBalanceEffect(tx, +1)
    R->>DB: SELECT accounts.type
    alt expense
        R->>DB: UPDATE from_account balance −amount
    else income / tabung_topup
        R->>DB: UPDATE to_account balance +amount
    else transfer
        R->>DB: UPDATE from −amount AND to +amount
    else tabung_withdraw
        R->>DB: UPDATE to_account balance −amount
    end
    R-->>H: Result.ok(tx)
    H-->>S: { data, loading:false }
```

The balance-effect helper (`applyBalanceEffect` + `adjustAccountBalance`) is the single source of truth for how each `TransactionType` moves money, reused by create, `updateWithBalance`, and `delete`.

---

## 7. Flow — Cashflow Summary (Edge Function)

Aggregation runs server-side so the client fetches one computed payload rather than pulling every asset/liability/transaction.

```mermaid
sequenceDiagram
    participant H as useCashflow
    participant Svc as edgeFunctions service
    participant EF as cashflow-summary (Deno)
    participant DB as Supabase (RLS)

    H->>Svc: getCashflowSummary("2026-07")
    Svc->>EF: functions.invoke (JWT forwarded)
    Note over EF: validate month "YYYY-MM"
    EF->>DB: parallel: assets · liabilities · income/expense txns
    DB-->>EF: rows (scoped to caller via forwarded JWT)
    Note over EF: net worth · passive income<br/>net cash flow · financial class<br/>6-month reconstructed trend
    EF-->>Svc: JSON summary
    Svc-->>H: Result.ok(CashflowSummary)
```

The function re-creates a Supabase client with the caller's `Authorization` header, so RLS still applies inside the function — it can never read another user's data. `analysis-monthly` follows the same pattern for chart data + category breakdown.

---

## 8. Flow — Recurring Rules on App Open

`processDueRecurring()` runs best-effort at startup: it materializes every due occurrence into real dated transactions (catching up missed periods in order) and rolls each rule's `next_date` forward. It is idempotent — re-running the same day is a no-op — and failures never block startup.

```mermaid
flowchart TD
    A["App open"] --> B{"authenticated?"}
    B -- no --> Z["return 0"]
    B -- yes --> C["fetchDue(today)"]
    C --> D{"for each due rule"}
    D --> E{"next_date ≤ today<br/>and ≤ end_date?"}
    E -- yes --> F["create transaction<br/>(applies balance effect)"]
    F --> G["notify 🔁 charged"]
    G --> H["next_date = addInterval(...)"]
    H --> E
    E -- no --> I["advance rule.next_date"]
    I --> D
    D -- done --> J["return count created"]
```

A parallel path (`usePendingRecurring` + `PendingRecurringModal`) can instead surface due occurrences for **manual** approve/skip via `approveRecurring` / `skipRecurring`, rather than auto-posting.

---

## 9. Security & Local Storage

```mermaid
graph TB
    subgraph Device["📱 Device (local)"]
        SS["expo-secure-store<br/>pin_set · pin_hash<br/>fingerprint_enabled · onboarding_done"]
        AS["AsyncStorage<br/>Supabase session (auto-refreshed)"]
    end

    subgraph Cloud["☁️ Supabase"]
        JWT["JWT (auth.uid())"]
        RLS{{"RLS policy on every table"}}
        Priv["Private buckets<br/>time-limited signed URLs (1h)"]
    end

    SS -.gates.-> App["App unlock (PIN / biometric)"]
    AS --> JWT
    JWT --> RLS
    RLS --> Rows["Only rows where user_id = auth.uid()"]
    App --> JWT
    Priv --> Signed["receipts · learn-images<br/>never public"]
```

- **App access** is gated locally by a hashed PIN (`pinCrypto` + `expo-secure-store`) and optional biometric — independent of network state.
- **Data access** is gated by RLS: the JWT's `auth.uid()` scopes every query and Edge Function call.
- **Files:** `avatars` is public-URL; `receipts` and `learn-images` are private and served via 1-hour signed URLs (batch-signed where possible).

---

## 10. Tech Stack

| Concern | Choice |
|---|---|
| Framework | Expo SDK 54 · React Native 0.81 · React 19 |
| Routing | expo-router 6 (file-based) |
| Styling | NativeWind 4 (Tailwind) — dark-mode only, accent `#C5FF00` |
| Animation | react-native-reanimated 4 + react-native-worklets |
| State | React Context (+ zustand available); per-feature hooks |
| Backend | Supabase — Auth, PostgreSQL + RLS, Edge Functions (Deno), Storage |
| Local storage | expo-secure-store (secrets/flags) · AsyncStorage (session) |
| Notifications | expo-notifications (local only) + `notifications` table |
| Icons / charts | lucide-react-native · react-native-svg |
| Testing | Jest + @testing-library/react-native |

---

## Architectural Principles (summary)

1. **Strict unidirectional layering.** Screen → Context/Hook → Repository/Service → `supabase`. UI never imports the client.
2. **`Result<T, E>` everywhere.** Data functions return typed results; hooks own loading/error; nothing throws across a layer boundary.
3. **Thin server, targeted compute.** Direct CRUD by default; Edge Functions only for aggregates (net worth, trends, analysis) that are cheaper server-side.
4. **Database-owned authorization.** RLS on every table (and forwarded into Edge Functions) is the real security boundary; the local PIN is UX/device protection.
5. **Idempotent, best-effort background work.** Recurring processing catches up missed periods and can safely re-run on every open.
6. **Client-maintained balances.** A single balance-effect function defines how each transaction type moves money, reused across create/update/delete.
