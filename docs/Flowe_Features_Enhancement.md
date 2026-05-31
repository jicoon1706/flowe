# Flowe — Features & Enhancements

Tracking list of new features, bug fixes, and polish items. Items are grouped by area, with the most impactful bugs first.

---

---

## ✨ New Features

### 5. Auto-refresh across screens
Data should refresh automatically (on focus / pull-to-refresh / realtime) so balances stay current without manual reload.
- **Screens:** Tabung detail, Bank detail, Wallet detail, Home, Calendar, Cashflow.
- **Where:** `app/(main)/home/tabung/[id].tsx`, `app/(main)/home/account/[id].tsx`, `app/(main)/home/wallet/[id].tsx`, `app/(main)/index.tsx`, `app/(main)/calendar.tsx`, `app/(main)/cashflow/index.tsx`
- **Suggested approach:** `useFocusEffect` to refetch on navigation, optionally Supabase realtime subscriptions for live balance updates.

