export interface Rgb { r: number; g: number; b: number }
export interface Hsl { h: number; s: number; l: number }
export interface Hsv { h: number; s: number; v: number }

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** Accepte `#rgb`, `#rrggbb`, `rgb(r,g,b)` ou `hsl(h,s%,l%)`. Retourne null si invalide. */
export function parseColor(input: string | null | undefined): Rgb | null {
  if (!input) return null;
  const s = input.trim();
  let m = /^#?([0-9a-f]{3})$/i.exec(s);
  if (m) return { r: parseInt(m[1][0] + m[1][0], 16), g: parseInt(m[1][1] + m[1][1], 16), b: parseInt(m[1][2] + m[1][2], 16) };
  m = /^#?([0-9a-f]{6})$/i.exec(s);
  if (m) return { r: parseInt(m[1].slice(0, 2), 16), g: parseInt(m[1].slice(2, 4), 16), b: parseInt(m[1].slice(4, 6), 16) };
  m = /^rgb\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*\)$/i.exec(s);
  if (m) return { r: clamp(+m[1], 0, 255), g: clamp(+m[2], 0, 255), b: clamp(+m[3], 0, 255) };
  m = /^hsl\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})%?\s*[, ]\s*(\d{1,3})%?\s*\)$/i.exec(s);
  if (m) return hslToRgb({ h: +m[1] % 360, s: clamp(+m[2], 0, 100), l: clamp(+m[3], 0, 100) });
  return null;
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l: Math.round(l * 100) };
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === rr ? (gg - bb) / d + (gg < bb ? 6 : 0) : max === gg ? (bb - rr) / d + 2 : (rr - gg) / d + 4;
  return { h: Math.round(h * 60) % 360, s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const ss = s / 100, ll = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = ss * Math.min(ll, 1 - ll);
  const f = (n: number) => ll - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

export function rgbToHsv({ r, g, b }: Rgb): Hsv {
  const rr = r / 255, gg = g / 255, bb = b / 255;
  const max = Math.max(rr, gg, bb), min = Math.min(rr, gg, bb);
  const d = max - min;
  let h = 0;
  if (d !== 0) h = max === rr ? ((gg - bb) / d + (gg < bb ? 6 : 0)) * 60 : max === gg ? ((bb - rr) / d + 2) * 60 : ((rr - gg) / d + 4) * 60;
  return { h: Math.round(h) % 360, s: max === 0 ? 0 : Math.round((d / max) * 100), v: Math.round(max * 100) };
}

export function hsvToRgb({ h, s, v }: Hsv): Rgb {
  const ss = s / 100, vv = v / 100;
  const f = (n: number) => { const k = (n + h / 60) % 6; return vv - vv * ss * Math.max(0, Math.min(k, 4 - k, 1)); };
  return { r: Math.round(f(5) * 255), g: Math.round(f(3) * 255), b: Math.round(f(1) * 255) };
}

/** Couleur de texte lisible (blanc/noir) pour un fond donné — contraste WCAG. */
export function readableOn(rgb: Rgb): 'light' | 'dark' {
  const lin = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = 0.2126 * lin(rgb.r) + 0.7152 * lin(rgb.g) + 0.0722 * lin(rgb.b);
  return L > 0.4 ? 'dark' : 'light';
}
