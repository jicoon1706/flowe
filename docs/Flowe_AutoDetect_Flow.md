# Flowe — Outside-App Transaction Detection

How a payment made **outside Flowe** (a bank or e-wallet app notification) becomes a
transaction row, with or without the user ever opening the app.

**Android only.** iOS gives no app a way to read another app's notifications, so
`FloweNotifications.isAvailable` is `false` there and the whole flow is inert.

| Piece | Where |
|---|---|
| Notification listener service | `modules/flowe-notifications/android/.../TransactionNotificationListenerService.kt` |
| On-device capture queue | `.../CaptureStore.kt` |
| Quick-capture notification + actions | `.../QuickCaptureNotifier.kt`, `.../QuickCaptureReceiver.kt` |
| JS bridge | `modules/flowe-notifications/index.ts` |
| Orchestration hook | `src/hooks/useDetectedTransactions.ts` |
| Parsing / matching | `src/utils/parseTransactionNotification.ts`, `src/utils/resolveDetectedAccount.ts` |
| Account matching rules | `src/utils/accountMatching.ts` (shared by the resolver and the settings screen) |
| In-app confirm UI | `components/home/DetectedTransactionIsland.tsx` |
| Watched apps | `constants/notificationSources.ts` |
| Settings screen | `app/(main)/settings/auto-detect.tsx` |

## 1. Flow Overview

```mermaid
graph TD
    A["🏦 Bank / e-wallet app<br/>posts a notification"] --> B{"Auto-detect enabled<br/>& package watched?"}
    B -- no --> X1["ignored"]
    B -- yes --> C{"looksLikeTransaction?<br/>amount + money moved,<br/>not a promo/OTP/reminder"}
    C -- no --> X1
    C -- yes --> D{"Duplicate?<br/>same content, seconds apart"}
    D -- yes --> X1
    D -- no --> E["CaptureStore.add(capture)<br/>id · pkg · title · text · postedAt"]

    E --> F["QuickCaptureNotifier.post<br/>Expense | Income | Ignore + inline name"]
    E -.->|"app running"| L["emitCapture → live listener"]

    F --> G{"User answers<br/>from the shade?"}
    G -- "Ignore" --> H["CaptureStore.remove<br/>never reaches Supabase"]
    G -- "Expense / Income" --> I["CaptureStore.resolve<br/>chosenType + chosenName"]
    G -- "taps body" --> J["opens Flowe on this detection"]
    G -- "no answer" --> K["stays queued in the shade"]

    I --> M
    J --> M
    K --> M
    L --> M["useDetectedTransactions.refresh()<br/>on mount · on capture · on AppState 'active'"]

    M --> N["parseTransactionNotification()<br/>amount · type · merchant · last4 · bankId"]
    N -- "unparseable" --> O["removeCapture — prune the queue"]
    N --> P["resolveDetectedAccount()<br/>bank match → last-4 match → single wallet"]

    P --> Q{"Answered in shade<br/>AND account resolved?"}
    Q -- yes --> R["silent path: save with<br/>merchantCategory() guess"]
    Q -- no --> S["DetectedTransactionIsland<br/>name · type · account · category"]

    S -- "Save" --> R
    S -- "X (not a transaction)" --> H
    S -- "10s timeout, collapsed" --> T["snooze — hidden in app,<br/>still in the shade"]
    T -.->|"next foreground"| M

    R --> U["transactionsRepository.create<br/>dated by notification postTime"]
    U --> V["✅ Supabase row + removeCapture(id)<br/>+ in-app 'added automatically' notice"]

    classDef native fill:#2a2a2a,stroke:#00d4ff,color:#fff
    classDef js fill:#2a2a2a,stroke:#C5FF00,color:#fff
    classDef done fill:#2a2a2a,stroke:#6bcf7f,color:#fff
    classDef drop fill:#2a2a2a,stroke:#ff6b6b,color:#fff
    class A,B,C,D,E,F,I native
    class M,N,P,Q,S,R,U js
    class V done
    class X1,H,O,T drop
```

## 2. End-to-End Sequence

```mermaid
sequenceDiagram
    autonumber
    participant Bank as Bank / e-wallet app
    participant NLS as NotificationListenerService
    participant Store as CaptureStore (SharedPrefs)
    participant Shade as Quick-capture notification
    participant User
    participant JS as useDetectedTransactions
    participant SB as Supabase

    Bank->>NLS: onNotificationPosted(sbn)
    Note over NLS: enabled? · watched package?<br/>looksLikeTransaction? · not a duplicate?
    NLS->>Store: add(Capture{id, pkg, title, text, postedAt})
    NLS-->>JS: emitCapture (only if app is running)
    NLS->>Shade: post(amount, source) + 3 actions + inline name

    alt Answered from the shade (app never opened)
        User->>Shade: tap Expense / Income (+ types a name)
        Shade->>Store: resolve(id, chosenType, chosenName)
        Shade-->>Shade: cancel notification
    else Ignore
        User->>Shade: tap Ignore
        Shade->>Store: remove(id)
        Note right of Store: never reaches Supabase
    else Tap the body
        User->>Shade: tap notification
        Shade->>JS: open Flowe on this detection
    end

    Note over JS: AppState → 'active' → refresh()
    JS->>Store: getCaptures()
    JS->>JS: parseTransactionNotification()
    JS->>JS: resolveDetectedAccount(parsed, accounts)

    alt answered in shade AND account resolved
        JS->>SB: transactions.create(...)
    else needs confirmation
        JS-->>User: DetectedTransactionIsland
        User->>JS: name / type / account / category → Save
        JS->>SB: transactions.create(...)
    end

    SB-->>JS: ok
    JS->>Store: removeCapture(id)
    JS->>SB: notify("added automatically")
```

## 3. Lifecycle of One Capture

```mermaid
stateDiagram-v2
    [*] --> Screened: notification posted
    Screened --> [*]: not watched / no amount / duplicate
    Screened --> Queued: CaptureStore.add

    Queued --> Answered: shade action Expense/Income
    Queued --> Discarded: shade action Ignore
    Queued --> Parsed: app opens → refresh()
    Answered --> Parsed: app opens → refresh()

    Parsed --> [*]: unparseable → pruned
    Parsed --> AutoFiled: answered + account resolved
    Parsed --> AwaitingUser: island shown

    AwaitingUser --> AutoFiled: user taps Save
    AwaitingUser --> Snoozed: 10s timeout (collapsed only)
    AwaitingUser --> Discarded: user dismisses (X)
    Snoozed --> AwaitingUser: next app foreground

    AutoFiled --> [*]: row in Supabase + removeCapture
    Discarded --> [*]: removeCapture

    note right of Queued
      Survives app kill. The listener has no
      Supabase session, so only the app can
      write — this queue is the bridge.
    end note
```

## Design Notes

- **The queue is the bridge.** The listener service runs with no signed-in Supabase
  session, so captures live in `SharedPreferences` until the app next runs and flushes
  them. Nothing is lost if the phone reboots or Flowe is force-stopped.
- **Loose native screen, authoritative JS parse.** Kotlin asks three things: is there a
  ringgit amount, does the text say money actually moved, and does it read as marketing?
  An amount alone is the shape a promo, a fee schedule and a balance reminder all share,
  so it is never enough. Type, merchant, last-4 and bank all come from
  `parseTransactionNotification.ts`, which is a pure function, unit-tested, and updatable
  via OTA without a native rebuild — so the native list stays the looser of the two.
- **No detection without somewhere to put it.** Settings → Auto-detect will not enable
  the feature, or watch an app, unless the user holds an account it could file into: the
  master toggle prompts them to add an account, per-app toggles are disabled, and an app
  whose account is later deleted is dropped from the watch list.
- **Last 4 digits are the only account tiebreaker.** A bank app's alert names the bank
  but the user may hold several accounts there, so the digits are editable in three
  places — onboarding, the account's edit sheet, and Settings → Auto-detect — and
  `resolveDetectedAccount` treats them as decisive, including refusing an account whose
  stored digits contradict the alert.
- **Transaction time is `sbn.postTime`,** not when Flowe read it — the row is dated when
  the payment actually happened.
- **Never guess an account.** `resolveDetectedAccount` returns `undefined` when the bank
  and last-4 don't pin one row (or the user has several wallets); the user picks instead,
  because a wrong guess silently moves the wrong balance.
- **Dismiss ≠ snooze.** The island's X discards the detection for good; the 10s timeout
  only hides it — the Android notification is still in the shade, and the detection is
  offered again on the next foreground.
- **The notification does not auto-cancel.** Opening Flowe on a detection isn't the same
  as filing it; only saving or dismissing cancels it.
