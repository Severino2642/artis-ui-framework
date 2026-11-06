import { hslToRgb, hsvToRgb, parseColor, readableOn, rgbToHex, rgbToHsl, rgbToHsv } from './color-utils';

describe('color-utils', () => {
  it('parseColor : #rgb, #rrggbb, sans #, rgb(), hsl()', () => {
    expect(parseColor('#fa0')).toEqual({ r: 255, g: 170, b: 0 });
    expect(parseColor('EA580C')).toEqual({ r: 234, g: 88, b: 12 });
    expect(parseColor('rgb(1, 2, 3)')).toEqual({ r: 1, g: 2, b: 3 });
    expect(parseColor('rgb(999,0,0)')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseColor('hsl(0, 100%, 50%)')).toEqual({ r: 255, g: 0, b: 0 });
  });
  it.each(['', null, undefined, '#12', '#GGGGGG', 'rouge', 'rgb(1,2)'])('parseColor(%s) → null', (v) => expect(parseColor(v as string)).toBeNull());
  it('rgbToHex en majuscules, borné', () => {
    expect(rgbToHex({ r: 234, g: 88, b: 12 })).toBe('#EA580C');
    expect(rgbToHex({ r: -5, g: 300, b: 0 })).toBe('#00FF00');
  });
  it('aller-retour RGB ↔ HSL ↔ HSV', () => {
    for (const c of [{ r: 234, g: 88, b: 12 }, { r: 10, g: 200, b: 90 }, { r: 128, g: 128, b: 128 }, { r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 }]) {
      const a = hslToRgb(rgbToHsl(c)); const b = hsvToRgb(rgbToHsv(c));
      for (const k of ['r', 'g', 'b'] as const) { expect(Math.abs(a[k] - c[k])).toBeLessThanOrEqual(3); expect(Math.abs(b[k] - c[k])).toBeLessThanOrEqual(3); }
    }
  });
  it('readableOn choisit un texte contrasté', () => {
    expect(readableOn({ r: 255, g: 255, b: 255 })).toBe('dark');
    expect(readableOn({ r: 0, g: 0, b: 0 })).toBe('light');
  });
});
