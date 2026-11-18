import { fireEvent, render, screen } from '@testing-library/react-native';
import { Coffee } from 'lucide-react-native';
import { CashFlowDiagramCard, diagramInsight } from '../components/cashflow/CashFlowDiagramCard';
import { ExpensesSection } from '../components/cashflow/ExpensesSection';
import { NetWorthHero, classChipLabel } from '../components/cashflow/NetWorthHero';
import { NetWorthTrendCard, axisLabel } from '../components/cashflow/NetWorthTrendCard';
import { PatternCard } from '../components/cashflow/PatternCard';

const layout = (width: number) => ({ nativeEvent: { layout: { x: 0, y: 0, width, height: 400 } } });
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

describe('Cashflow tab cards', () => {
  it('labels the class chip with coverage, or No debts', () => {
    expect(classChipLabel('middle', 2.5)).toBe('Middle class · 2.5× coverage');
    expect(classChipLabel('poor', null)).toBe('Poor · No debts');
  });

  it('hero shows net worth, the chip and both stats; the chip opens the patterns', () => {
    const onClass = jest.fn();
    render(<NetWorthHero monthLabel="November 2026" onBack={jest.fn()} onMonth={jest.fn()} onInfo={jest.fn()} onClass={onClass} loading={false}
      data={{ netWorth: 14830.42, assets: 24680.42, liabilities: 9850, cls: 'middle', coverage: 2.5 }} />);
    expect(screen.getByLabelText('RM 14,830.42')).toBeTruthy();
    expect(screen.getByText('Assets')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Middle class · 2.5× coverage. See cash flow patterns'));
    expect(onClass).toHaveBeenCalled();
  });

  it('hero error offers Try again only', () => {
    const retry = jest.fn();
    render(<NetWorthHero monthLabel="November 2026" onBack={jest.fn()} onMonth={jest.fn()} onInfo={jest.fn()} onClass={jest.fn()} loading={false} data={null} onRetry={retry} />);
    fireEvent.press(screen.getByText('Try again'));
    expect(retry).toHaveBeenCalled();
  });

  it('trend draws an accessible chart, the change and the legend', () => {
    const points = ['06', '07', '08', '09', '10', '11'].map((m, i) => ({ month: `2026-${m}-01`, assets: 17000 + i * 1500, liabilities: 10600 - i * 150, netWorth: 6400 + i * 1650 }));
    render(<NetWorthTrendCard points={points} loading={false} />);
    expect(screen.getByText('Jun – Nov 2026')).toBeTruthy();
    expect(screen.getByText('+RM 8,250')).toBeTruthy();
    const chart = screen.getByLabelText(/^Net worth trend, Jun 2026 to Nov 2026\./);
    fireEvent(chart, 'layout', layout(326));
    expect(screen.getByText('Liabilities')).toBeTruthy();
    expect(axisLabel(20000)).toBe('20k');
  });

  it('trend with under two months of values explains itself', () => {
    render(<NetWorthTrendCard points={[{ month: '2026-11-01', assets: 0, liabilities: 0, netWorth: 0 }]} loading={false} />);
    expect(screen.getByText('Your trend appears once you have two months of history.')).toBeTruthy();
  });

  it('diagram describes every flow and gives the insight', () => {
    render(<CashFlowDiagramCard monthLabel="Nov 2026" income={4450} incomeLines={['Salary 3,200']} expenses={2486.7} expenseLines={['Food']} assets={24680.42}
      assetLines={['Cash 12,680.42']} liabilities={9850} liabilityLines={['PTPTN']} passive={{ total: 52, items: [{ name: 'ASB', amount: 52 }] }}
      repayments={{ total: 150, items: [{ name: 'PTPTN', amount: 150 }] }} loading={false} />);
    const d = screen.getByLabelText(/^Cash flow diagram for Nov 2026\./);
    fireEvent(d, 'layout', layout(326));
    expect(screen.getByText('+RM 1,963.30')).toBeTruthy();
    expect(screen.getByText('ASB')).toBeTruthy();
    expect(screen.getByText(diagramInsight(52, 2486.7))).toBeTruthy();
    expect(diagramInsight(52, 2486.7)).toBe('Your assets pay RM 52.00 a month. Grow that line to pass your RM 2,486.70 expenses.');
  });

  it('pattern marks You, shows the flow and the coverage bar', () => {
    const onSeeAll = jest.fn();
    render(<PatternCard cls="middle" passive={52} expenses={2486.7} pct={2} onSeeAll={onSeeAll} loading={false} />);
    expect(screen.getByLabelText('Pattern track: Poor, Middle class, Rich. You are Middle class.')).toBeTruthy();
    expect(screen.getByLabelText('Your flow: Job to Liabilities to Assets')).toBeTruthy();
    expect(screen.getByLabelText('Passive income covers 2 percent of expenses')).toBeTruthy();
    fireEvent.press(screen.getByText('See all patterns'));
    expect(onSeeAll).toHaveBeenCalled();
  });

  it('expenses: View All, bubbles and tiles open the transactions', () => {
    const onCategory = jest.fn();
    const onViewAll = jest.fn();
    render(<ExpensesSection monthName="November" total={1000} items={[{ category: 'food', amount: 600, share: 0.6 }, { category: 'bills', amount: 400, share: 0.4 }]}
      labelOf={(c) => c} iconOf={() => Coffee} onCategory={onCategory} onViewAll={onViewAll} onAdd={jest.fn()} loading={false} layout="phone" />);
    fireEvent(screen.getByLabelText('Spending by category'), 'layout', layout(374));
    fireEvent.press(screen.getByLabelText('food, 60% of spending'));
    expect(onCategory).toHaveBeenCalledWith('food');
    fireEvent.press(screen.getByText('View All'));
    expect(onViewAll).toHaveBeenCalled();
  });

  it('expenses empty state offers Add transaction', () => {
    const onAdd = jest.fn();
    render(<ExpensesSection monthName="November" total={0} items={[]} labelOf={(c) => c} iconOf={() => Coffee} onCategory={jest.fn()} onViewAll={jest.fn()} onAdd={onAdd} loading={false} layout="tablet" />);
    expect(screen.getByText('No spending in November yet')).toBeTruthy();
    fireEvent.press(screen.getByText('Add transaction'));
    expect(onAdd).toHaveBeenCalled();
  });
});
