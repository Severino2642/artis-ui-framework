import { TestBed } from '@angular/core/testing';
import { ThemeService, provideArtTheme } from './theme.service';

describe('ThemeService', () => {
  const root = () => document.documentElement;

  beforeEach(() => {
    localStorage.clear();
    root().removeAttribute('data-theme');
    TestBed.resetTestingModule();
  });

  it('applique le thème par défaut sur <html data-theme>', () => {
    TestBed.configureTestingModule({ providers: [provideArtTheme({ defaultTheme: 'ocean' })] });
    TestBed.inject(ThemeService);
    TestBed.tick();
    expect(root().getAttribute('data-theme')).toBe('ocean');
  });

  it('light par défaut, liste les 4 thèmes fournis', () => {
    const s = TestBed.inject(ThemeService);
    TestBed.tick();
    expect(root().getAttribute('data-theme')).toBe('light');
    expect(s.available).toEqual(['light', 'dark', 'ocean', 'forest']);
  });

  it('set() change le thème et le mémorise', () => {
    const s = TestBed.inject(ThemeService);
    s.set('forest');
    TestBed.tick();
    expect(root().getAttribute('data-theme')).toBe('forest');
    expect(localStorage.getItem('art-theme')).toBe('forest');
  });

  it('relit le choix mémorisé au démarrage', () => {
    localStorage.setItem('art-theme', 'dark');
    const s = TestBed.inject(ThemeService);
    expect(s.theme()).toBe('dark');
    expect(s.isDark()).toBe(true);
  });

  it('persistance désactivable (storageKey: null)', () => {
    TestBed.configureTestingModule({ providers: [provideArtTheme({ storageKey: null })] });
    TestBed.inject(ThemeService).set('dark');
    expect(localStorage.getItem('art-theme')).toBeNull();
  });

  it('toggle() bascule clair ↔ sombre', () => {
    const s = TestBed.inject(ThemeService);
    s.toggle();
    expect(s.resolved()).toBe('dark');
    s.toggle();
    expect(s.resolved()).toBe('light');
  });

  it('auto suit prefers-color-scheme', () => {
    let listener: ((e: { matches: boolean }) => void) | undefined;
    vi.stubGlobal('matchMedia', () => ({
      matches: true,
      addEventListener: (_: string, fn: typeof listener) => (listener = fn),
      removeEventListener: () => undefined,
    }));
    const s = TestBed.inject(ThemeService);
    s.set('auto');
    expect(s.resolved()).toBe('dark');
    listener?.({ matches: false });
    expect(s.resolved()).toBe('light');
    vi.unstubAllGlobals();
  });
});
