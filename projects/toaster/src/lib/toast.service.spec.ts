import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';
import { provideToaster } from './toast.service';

describe('ToastService', () => {
  let s: ToastService;
  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideToaster({ maxVisible: 2, durations: { success: 1000, info: 1000, warning: 1000, error: 0 } })] });
    s = TestBed.inject(ToastService);
  });
  afterEach(() => vi.useRealTimers());

  it('success/error/warning/info créent un toast du bon type avec icône et titre par défaut', () => {
    s.success('a'); s.error('b'); s.warning('c'); s.info('d');
    expect(s.all().map((t) => t.type)).toEqual(['success', 'error', 'warning', 'info']);
    expect(s.all()[0].icon).toBe('check_circle');
    expect(s.all()[1].title).toBe('Erreur');
  });

  it('limite l’affichage à maxVisible et met le reste en file', () => {
    s.info('1'); s.info('2'); s.info('3');
    expect(s.visible().length).toBe(2);
    expect(s.queued()).toBe(1);
  });

  it('ferme automatiquement après la durée (avec animation de sortie)', () => {
    s.success('x');
    vi.advanceTimersByTime(1000);
    expect(s.all()[0].leaving).toBe(true);
    vi.advanceTimersByTime(200);
    expect(s.all().length).toBe(0);
  });

  it('une erreur reste affichée tant qu’on ne la ferme pas (durée 0)', () => {
    s.error('boom');
    vi.advanceTimersByTime(60_000);
    expect(s.all().length).toBe(1);
  });

  it('dédoublonne par id et relance la minuterie', () => {
    s.info({ id: 'same', message: 'v1' });
    s.info({ id: 'same', message: 'v2' });
    expect(s.all().length).toBe(1);
    expect(s.all()[0].message).toBe('v2');
  });

  it('pause/resume suspend la minuterie (survol, focus)', () => {
    const id = s.success('x');
    s.pause(id);
    vi.advanceTimersByTime(5000);
    expect(s.all().length).toBe(1);
    s.resume(id);
    vi.advanceTimersByTime(1200);
    expect(s.all().length).toBe(0);
  });

  it('runAction exécute le handler puis ferme (sauf keepOpen)', () => {
    const handler = vi.fn();
    const id = s.error({ message: 'x', action: { label: 'Réessayer', handler } });
    s.runAction(id);
    expect(handler).toHaveBeenCalledOnce();
    expect(s.all()[0].leaving).toBe(true);
  });

  it('clear() vide tout', () => {
    s.info('a'); s.error('b');
    s.clear();
    expect(s.all().length).toBe(0);
  });
});
