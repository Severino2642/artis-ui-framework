import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoaderService, provideArtApi } from '@artis/api';
import { provideToaster, ToastService } from '@artis/toaster';
import { ArtDataListComponent } from './list/data-list/data-list.component';
import { ArtDetailCardComponent } from './detail/detail-card/detail-card.component';
import { ArtFooterComponent } from './layout/footer/footer.component';
import { ArtFormBuilderComponent } from './form/form-builder/form-builder.component';
import { ArtLoaderComponent } from './layout/loader/loader.component';
import { ArtMainLayoutComponent } from './layout/main-layout/main-layout.component';
import { expectNoA11yViolations, flush } from './testing';

const el = (f: ComponentFixture<unknown>) => f.nativeElement as HTMLElement;

describe('Composants portés (rendu, explications, tokens)', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [provideRouter([]), provideToaster(), provideArtApi({ baseUrl: '', storage: 'memory' }), provideHttpClientTesting()],
  }));
  void provideHttpClient;

  it('ArtFooterComponent : aucun contenu de marque par défaut', () => {
    const f = TestBed.createComponent(ArtFooterComponent);
    f.detectChanges();
    expect(el(f).textContent).not.toMatch(/artis|automation|status\./i);
    f.componentRef.setInput('companyName', 'Acme');
    f.componentRef.setInput('linkGroups', [{ title: 'Produit', links: [{ label: 'Docs', href: '/docs' }] }]);
    f.detectChanges();
    expect(el(f).textContent).toContain('Acme');
    expect(el(f).textContent).toContain('Docs');
  });

  it('ArtDetailCardComponent : explication sur le titre de carte, de colonne et de champ', () => {
    const f = TestBed.createComponent(ArtDetailCardComponent);
    f.componentRef.setInput('config', {
      title: 'Client', explanation: 'Fiche **client**',
      sections: [{ columns: [{ title: 'Contact', explanation: 'Coordonnées', sectionColumns: [{ fields: [{ attribute: 'email', label: 'E-mail', explanation: 'Adresse pro' }] }] }] }],
    });
    f.componentRef.setInput('data', { email: 'a@b.co' });
    f.detectChanges();
    expect(el(f).querySelectorAll('art-info-tip').length).toBe(3);
    expect(el(f).textContent).toContain('a@b.co');
  });

  it('ArtDataListComponent : explication dans l’en-tête de colonne, données rendues', () => {
    const f = TestBed.createComponent(ArtDataListComponent);
    f.componentRef.setInput('config', {
      title: 'Clients', pageSize: 5, defaultViewMode: 'table',
      columns: [{ key: 'name', title: 'Nom', explanation: 'Raison sociale', sortable: true, sections: [{ fields: [{ attribute: 'name' }] }] }],
    });
    f.componentRef.setInput('data', [{ name: 'Acme' }, { name: 'Globex' }]);
    f.detectChanges();
    const th = el(f).querySelector('th art-info-tip');
    expect(th).not.toBeNull();
    expect(el(f).textContent).toContain('Acme');
    expect(el(f).textContent).toContain('Globex');
  });

  it('ArtFormBuilderComponent : explication de section, bouton de repli accessible, champs avec libellés liés', async () => {
    const f = TestBed.createComponent(ArtFormBuilderComponent);
    f.componentRef.setInput('config', { sections: [{ title: 'Identité', explanation: 'Données **légales**', fields: [{ name: 'nom', label: 'Nom', type: 'text', explanation: 'Nom complet' }] }] });
    f.detectChanges();
    expect(el(f).querySelectorAll('art-info-tip').length).toBe(2);
    const toggle = el(f).querySelector<HTMLButtonElement>('.fb-section-toggle')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.getAttribute('aria-label')).toBe('Identité');
    const input = el(f).querySelector('input')!;
    expect(el(f).querySelector(`label[for="${input.id}"]`)).not.toBeNull();
    await expectNoA11yViolations(el(f), ['nested-interactive']);
  });

  it('ArtFormBuilderComponent : formulaire invalide → toast (plus d’alert())', async () => {
    const alertSpy = vi.fn(); vi.stubGlobal('alert', alertSpy);
    const f = TestBed.createComponent(ArtFormBuilderComponent);
    f.componentRef.setInput('config', { sections: [{ title: 'S', fields: [{ name: 'n', label: 'N', type: 'text', required: true, validation: { validators: [{ type: 'required' }] } }] }] });
    f.detectChanges();
    const save = Array.from(el(f).querySelectorAll<HTMLButtonElement>('button')).find((b) => /enregistrer|sauvegarder|save/i.test(b.textContent ?? ''));
    save?.click(); await flush(20); f.detectChanges();
    expect(alertSpy).not.toHaveBeenCalled();
    if (save) expect(TestBed.inject(ToastService).all().some((t) => t.id === 'art-form-invalid')).toBe(true);
    vi.unstubAllGlobals();
  });

  it('ArtLoaderComponent : suit LoaderService, annoncé role=status', () => {
    const f = TestBed.createComponent(ArtLoaderComponent);
    const loader = TestBed.inject(LoaderService);
    f.detectChanges();
    expect(el(f).querySelector('.art-loader')).toBeNull();
    loader.show(); f.detectChanges();
    expect(el(f).querySelector('.art-loader')?.getAttribute('role')).toBe('status');
    loader.hide(); f.detectChanges();
    expect(el(f).querySelector('.art-loader')).toBeNull();
  });

  it('ArtMainLayoutComponent : se construit sans service ni donnée du projet d’origine', () => {
    const f = TestBed.createComponent(ArtMainLayoutComponent);
    f.componentRef.setInput('menuItems', [{ id: 'a', nom: 'Accueil', icon: 'home', route: '/a', order: 0, niveau: 0 }]);
    f.componentRef.setInput('brandName', 'Mon app');
    f.detectChanges();
    expect(el(f).textContent).toContain('Mon app');
    expect(el(f).textContent).not.toMatch(/danang|calvin|studio/i);
  });
});
