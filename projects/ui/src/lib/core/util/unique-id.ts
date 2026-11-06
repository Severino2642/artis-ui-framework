let seq = 0;
/** Identifiant DOM unique (pour `for`, `aria-describedby`, `aria-labelledby`). */
export function uniqueId(prefix = 'art'): string {
  return `${prefix}-${++seq}`;
}
