import { lineHeightFor } from '../components/ui/Text';

describe('lineHeightFor (Android big-figure clipping)', () => {
  it('lifts tight display line heights to 1.2 on Android', () => {
    expect(lineHeightFor(1, 56, 'android')).toBe(1.2); // numeric-lg
    expect(lineHeightFor(1.1, 56, 'android')).toBe(1.2); // display-lg
    expect(lineHeightFor(1.15, 32, 'android')).toBe(1.2); // display-md
  });

  it('keeps body text and other platforms on the design values', () => {
    expect(lineHeightFor(1.4, 16, 'android')).toBe(1.4);
    expect(lineHeightFor(1.2, 15, 'android')).toBe(1.2);
    expect(lineHeightFor(1, 56, 'ios')).toBe(1);
  });
});
