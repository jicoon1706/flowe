import fs from 'fs';

/* eslint-disable @typescript-eslint/no-require-imports */
const tokens = require('../theme/tokens');
const { render, toAndroid, OUT } = require('../scripts/generate-native-tokens');
const source = require('../design/tailwind.theme.json');

describe('design tokens', () => {
  it('carries every colour from design/tailwind.theme.json unchanged', () => {
    for (const [name, value] of Object.entries(source.theme.extend.colors)) {
      expect(tokens.colors[name]).toBe(value);
    }
  });

  it('adds the two AA tokens from the design rules', () => {
    expect(tokens.colors['on-surface-variant-aa']).toBe('#666666');
    expect(tokens.colors['on-primary-soft']).toBe('rgba(255,255,255,0.8)');
  });

  it('limits charts to the three blues', () => {
    expect(tokens.chart).toEqual(['#011a4d', '#1665b1', '#7b9dbc']);
  });
});

describe('native widget colours', () => {
  it('converts colours to Android #AARRGGBB', () => {
    expect(toAndroid('#011a4d')).toBe('#FF011A4D');
    expect(toAndroid('#ffffff29')).toBe('#29FFFFFF');
    expect(toAndroid('rgba(255,255,255,0.8)')).toBe('#CCFFFFFF');
  });

  it('checked-in flowe_tokens.xml matches the token module (run scripts/generate-native-tokens.js)', () => {
    expect(fs.readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n')).toBe(render());
  });
});
