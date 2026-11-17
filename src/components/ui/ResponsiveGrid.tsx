import { Children, type ReactNode } from 'react';
import { View } from 'react-native';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';

export interface ResponsiveGridProps {
  children: ReactNode;
  /** Gap between columns on tablet (dp). */
  gap?: number;
  /** Gap between rows on tablet (dp). Defaults to `gap`. */
  rowGap?: number;
}

/**
 * Card list that becomes a 2-column grid on tablet (for non-virtualised lists).
 * On phones the children render exactly as passed — no wrapper views.
 */
export function ResponsiveGrid({ children, gap = 12, rowGap }: ResponsiveGridProps) {
  const { columns } = useBreakpoint();
  if (columns === 1) return <>{children}</>;
  const items = Children.toArray(children).filter(Boolean);
  const rows: ReactNode[][] = [];
  for (let i = 0; i < items.length; i += columns) rows.push(items.slice(i, i + columns));
  return (
    <View style={{ gap: rowGap ?? gap }}>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: 'row', gap, alignItems: 'flex-start' }}>
          {Array.from({ length: columns }, (_, c) => (
            <View key={c} style={{ flex: 1, minWidth: 0 }}>{row[c] ?? null}</View>
          ))}
        </View>
      ))}
    </View>
  );
}

export interface ResponsiveColumnsProps {
  /** Each entry is one section; on tablet they sit side by side, on phone they stack as before. */
  children: ReactNode[];
  /** Gap between and inside the tablet columns (match the parent's stack gap). */
  gap?: number;
}

/**
 * Dashboard sections side by side on tablet. On phones the sections render in
 * order with no wrapper, so the parent's gap and layout are unchanged.
 */
export function ResponsiveColumns({ children, gap = 16 }: ResponsiveColumnsProps) {
  const { isTablet } = useBreakpoint();
  if (!isTablet) return <>{children}</>;
  return (
    <View style={{ flexDirection: 'row', gap, alignItems: 'flex-start' }}>
      {children.map((section, i) => (
        <View key={i} style={{ flex: 1, minWidth: 0, gap }}>{section}</View>
      ))}
    </View>
  );
}
