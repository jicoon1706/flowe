import { breakpointFor, centeredPadding, columnWidth, TABLET_MIN_WIDTH } from '../src/hooks/useBreakpoint';

describe('breakpointFor', () => {
  it('keeps phones on one column', () => {
    expect(breakpointFor(390)).toEqual({ isTablet: false, width: 390, columns: 1 });
    expect(breakpointFor(TABLET_MIN_WIDTH - 1).isTablet).toBe(false);
  });

  it('switches to tablet at 600 dp', () => {
    expect(breakpointFor(TABLET_MIN_WIDTH)).toEqual({ isTablet: true, width: 600, columns: 2 });
    expect(breakpointFor(820).columns).toBe(2);
  });
});

describe('centeredPadding', () => {
  it('never drops below the base padding', () => {
    expect(centeredPadding(390, 640, 16)).toBe(16);
    expect(centeredPadding(650, 640, 16)).toBe(16);
  });

  it('centres content within the max width', () => {
    expect(centeredPadding(1024, 640, 16)).toBe(192);
  });
});

describe('columnWidth', () => {
  it('returns the container width for one column', () => {
    expect(columnWidth(358, 1, 12)).toBe(358);
  });

  it('splits the row and its gaps', () => {
    expect(columnWidth(788, 2, 12)).toBe(388);
  });
});
