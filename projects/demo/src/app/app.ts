import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArtLoaderComponent, ArtMainLayoutComponent, NavbarItemCPLModel } from '@artis/ui';
import { ToastContainerComponent } from '@artis/toaster';

@Component({
  selector: 'demo-root',
  standalone: true,
  imports: [ArtMainLayoutComponent, ArtLoaderComponent, ToastContainerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <art-main-layout [menuItems]="menu" [user]="user" brandName="Artis UI" pageTitle="Démonstration" [autoLogout]="false" />
    <art-toast-container />
    <art-loader />
  `,
})
export class App {
  protected readonly user = { name: 'Demo User', email: 'demo@example.test' };
  protected readonly menu: NavbarItemCPLModel[] = [
    ['design', 'Design system', 'palette'], ['forms', 'Formulaires', 'edit_note'], ['modal', 'Modale', 'web_asset'], ['api', 'API & erreurs', 'cloud_sync'],
    ['list', 'Liste', 'table_rows'], ['detail', 'Détail', 'badge'], ['tabs', 'Onglets', 'tab'], ['form-builder', 'Form builder', 'dynamic_form'],
  ].map(([id, nom, icon], i) => ({ id, nom, icon, route: '/' + id, order: i, niveau: 1 }));
}
