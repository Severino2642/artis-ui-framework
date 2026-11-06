import axe from 'axe-core';

/** Attend la fin des micro/macro-tâches en attente. */
export const flush = (ms = 0) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Exécute axe-core (WCAG 2.x A/AA) sur un élément et échoue s'il y a des violations.
 * `color-contrast` est désactivée : jsdom ne calcule pas les styles réels (contrôlé séparément par les tokens).
 */
export async function expectNoA11yViolations(el: Element, extraDisabled: string[] = []): Promise<void> {
  const disabled = ['color-contrast', 'region', ...extraDisabled];
  const res = await axe.run(el as HTMLElement, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
    rules: Object.fromEntries(disabled.map((id) => [id, { enabled: false }])),
  });
  const summary = res.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.html.slice(0, 120)).join(' | ')}`);
  expect(summary).toEqual([]);
}
