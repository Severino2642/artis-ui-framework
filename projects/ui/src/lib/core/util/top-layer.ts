/**
 * Affichage « couche supérieure » (Popover API) pour les bulles et panneaux flottants.
 *
 * Pourquoi : un élément `position: fixed` est positionné par rapport au VIEWPORT… sauf si un ancêtre a un
 * `transform`, `filter`, `will-change`, `contain` ou `backdrop-filter` (cartes qui s'animent au survol, champs animés) :
 * il se positionne alors par rapport à cet ancêtre et apparaît « au hasard », et il est rogné par les `overflow: hidden`.
 * Un élément `popover` affiché en couche supérieure échappe à tout cela.
 * Repli : sans Popover API, l'élément reste en `position: fixed` (comportement précédent).
 */
const opened = new WeakSet<HTMLElement>();

type PopoverEl = HTMLElement & { showPopover?: () => void; hidePopover?: () => void };

export function openTopLayer(el: HTMLElement | null | undefined): void {
  const p = el as PopoverEl | null | undefined;
  if (!p || typeof p.showPopover !== 'function' || opened.has(p)) return;
  try {
    p.setAttribute('popover', 'manual');
    p.showPopover();
    opened.add(p);
  } catch { /* déjà ouvert ou non supporté : on garde le repli fixed */ }
}

export function closeTopLayer(el: HTMLElement | null | undefined): void {
  const p = el as PopoverEl | null | undefined;
  if (!p || !opened.has(p)) return;
  try { p.hidePopover?.(); } catch { /* ignoré */ }
  opened.delete(p);
}

/**
 * Appelle `cb` quand la fenêtre est redimensionnée ou qu'un conteneur quelconque défile (capture),
 * pour repositionner un panneau. Retourne la fonction de nettoyage.
 */
export function trackViewport(cb: () => void): () => void {
  window.addEventListener('resize', cb);
  document.addEventListener('scroll', cb, true);
  return () => {
    window.removeEventListener('resize', cb);
    document.removeEventListener('scroll', cb, true);
  };
}
