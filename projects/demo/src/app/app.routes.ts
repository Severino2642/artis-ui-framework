import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'design' },
  { path: 'design', loadComponent: () => import('./pages/design.page').then((m) => m.DesignPage) },
  { path: 'forms', loadComponent: () => import('./pages/forms.page').then((m) => m.FormsPage) },
  { path: 'modal', loadComponent: () => import('./pages/modal.page').then((m) => m.ModalPage) },
  { path: 'api', loadComponent: () => import('./pages/api.page').then((m) => m.ApiPage) },
  { path: 'list', loadComponent: () => import('./demos/data-list-demo/data-list-demo.component').then((m) => m.DataListDemoComponent) },
  { path: 'detail', loadComponent: () => import('./demos/detail-view-demo/detail-view-demo.component').then((m) => m.DetailViewDemoComponent) },
  { path: 'tabs', loadComponent: () => import('./demos/tab-view-demo/tab-view-demo.component').then((m) => m.TabViewDemoComponent) },
  { path: 'form-builder', loadComponent: () => import('./demos/form-builder-demo/form-builder-demo.component').then((m) => m.FormBuilderDemoComponent) },
];
