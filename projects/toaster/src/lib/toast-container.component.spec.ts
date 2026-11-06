import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastContainerComponent } from './toast-container.component';
import { ToastService, provideToaster } from './toast.service';

describe('ToastContainerComponent', () => {
  let fixture: ComponentFixture<ToastContainerComponent>;
  let svc: ToastService;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideToaster({ position: 'bottom-right' })] });
    fixture = TestBed.createComponent(ToastContainerComponent);
    svc = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  it('est une région nommée et suit la position configurée', () => {
    expect(el().getAttribute('role')).toBe('region');
    expect(el().getAttribute('aria-label')).toBe('Notifications');
    expect(el().className).toContain('art-toaster--bottom-right');
  });

  it('erreurs/avertissements : role=alert + aria-live=assertive ; succès/info : role=status + polite', () => {
    svc.error('e'); svc.warning('w'); svc.success('s'); svc.info('i');
    fixture.detectChanges();
    const toasts = Array.from(el().querySelectorAll<HTMLElement>('.art-toast'));
    expect(toasts.map((t) => t.getAttribute('role'))).toEqual(['alert', 'alert', 'status', 'status']);
    expect(toasts.map((t) => t.getAttribute('aria-live'))).toEqual(['assertive', 'assertive', 'polite', 'polite']);
  });

  it('affiche titre, message, bouton d’action et ferme au clic sur ✕', () => {
    const handler = vi.fn();
    svc.warning({ message: 'Disque presque plein', title: 'Stockage', action: { label: 'Libérer', handler } });
    fixture.detectChanges();
    expect(el().querySelector('.art-toast__title')?.textContent).toContain('Stockage');
    expect(el().querySelector('.art-toast__message')?.textContent).toContain('Disque presque plein');
    el().querySelector<HTMLButtonElement>('.art-toast__action')!.click();
    expect(handler).toHaveBeenCalled();
    const close = el().querySelector<HTMLButtonElement>('.art-toast__close');
    expect(close?.getAttribute('aria-label')).toBe('Fermer la notification');
  });

  it('indique le nombre de toasts en file', () => {
    for (let i = 0; i < 6; i++) svc.info('n' + i);
    fixture.detectChanges();
    expect(el().querySelectorAll('.art-toast').length).toBe(4);
    expect(el().querySelector('.art-toaster__queue')?.textContent).toContain('+2');
  });
});
