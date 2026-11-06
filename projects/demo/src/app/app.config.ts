import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideArtApi } from '@artis/api';
import { ART_COLOR_PALETTE, provideArtFieldType } from '@artis/ui';
import { provideArtTheme } from '@artis/theme';
import { provideToaster } from '@artis/toaster';
import { routes } from './app.routes';
import { mockBackendInterceptor } from './mock/mock-backend.interceptor';
import { RatingFieldComponent } from './shared/rating-field.component';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideArtTheme({ defaultTheme: 'light' }),
    provideToaster({ position: 'top-right', maxVisible: 4 }),
    provideArtApi(
      {
        baseUrl: '/api',
        storage: 'memory',
        authEndpoints: { login: '/auth/login', refresh: '/auth/refresh', logout: '/auth/logout' },
        // Codes d'erreur MÉTIER du projet → message + action
        businessErrors: {
          BILLING_RESTRICTED: { message: 'Votre abonnement est restreint. {detail}', title: 'Facturation', action: { label: 'Voir ma facturation', route: '/api' } },
          QUOTA_EXCEEDED: { message: 'Quota atteint ({detail}).', severity: 'warning' },
        },
      },
      { interceptors: [mockBackendInterceptor] }, // faux backend : démo uniquement
    ),
    provideArtFieldType('rating', RatingFieldComponent),
    { provide: ART_COLOR_PALETTE, useValue: ['#EA580C', '#1C1917', '#16A34A', '#DC2626'] },
  ],
};
