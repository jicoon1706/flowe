import { appendDigit, backspace } from '../components/ui/PinPad';

describe('PinPad helpers', () => {
  it('appends digit up to 6', () => {
    expect(appendDigit('', '1')).toBe('1');
    expect(appendDigit('12345', '6')).toBe('123456');
    expect(appendDigit('123456', '7')).toBe('123456');
  });
  it('backspaces', () => {
    expect(backspace('123')).toBe('12');
    expect(backspace('')).toBe('');
  });
});
