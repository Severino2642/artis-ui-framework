import { ComponentFixture, TestBed } from '@angular/core/testing';
import { expectNoA11yViolations, flush } from '../../testing';
import { TabConfig } from '../models/tab-view.model';
import { ArtTabViewComponent } from './tab-view.component';

describe('ArtTabViewComponent — accessibilité (WAI-ARIA Tabs)', () => {
  let f: ComponentFixture<ArtTabViewComponent>;
  const tabs: TabConfig[] = [{ id: 'a', label: 'Général' }, { id: 'b', label: 'Lignes', badge: 3 }, { id: 'c', label: 'Archive', disabled: true }, { id: 'd', label: 'Notes' }];
  const el = () => f.nativeElement as HTMLElement;
  const tab = (id: string) => el().querySelector<HTMLElement>(`[data-tab-id="${id}"]`)!;
  const key = (k: string) => el().querySelector('[role=tablist]')!.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

  beforeEach(async () => {
    f = TestBed.createComponent(ArtTabViewComponent);
    f.componentRef.setInput('tabs', tabs);
    f.componentRef.setInput('activeTabId', 'a');
    f.detectChanges(); await flush(); f.detectChanges();
  });

  it('structure : tablist, tabs, panneaux reliés (aria-controls / aria-labelledby), tabindex itinérant', () => {
    expect(el().querySelector('[role=tablist]')).not.toBeNull();
    expect(tab('a').getAttribute('role')).toBe('tab');
    expect(tab('a').getAttribute('aria-selected')).toBe('true');
    expect(tab('a').getAttribute('tabindex')).toBe('0');
    expect(tab('b').getAttribute('tabindex')).toBe('-1');
    expect(el().querySelector(`#${tab('a').getAttribute('aria-controls')}`)?.getAttribute('aria-labelledby')).toBe(tab('a').id);
  });

  it('flèches : passent à l’onglet suivant en sautant les onglets désactivés, bouclent, Début/Fin', () => {
    key('ArrowRight'); f.detectChanges();
    expect(tab('b').getAttribute('aria-selected')).toBe('true');
    key('ArrowRight'); f.detectChanges();
    expect(tab('d').getAttribute('aria-selected')).toBe('true'); // 'c' désactivé sauté
    key('ArrowRight'); f.detectChanges();
    expect(tab('a').getAttribute('aria-selected')).toBe('true'); // boucle
    key('End'); f.detectChanges();
    expect(tab('d').getAttribute('aria-selected')).toBe('true');
    key('Home'); f.detectChanges();
    expect(tab('a').getAttribute('aria-selected')).toBe('true');
    key('ArrowLeft'); f.detectChanges();
    expect(tab('d').getAttribute('aria-selected')).toBe('true');
  });

  it('a11y (axe)', async () => {
    await expectNoA11yViolations(el(), ['aria-required-children', 'scrollable-region-focusable']);
  });
});
