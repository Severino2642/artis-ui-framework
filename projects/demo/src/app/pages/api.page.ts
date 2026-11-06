import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ApiError, ApiService, SessionService } from '@artis/api';

const CASES: { label: string; path: string }[] = [
  { label: '400', path: '/fail/400' }, { label: '401', path: '/fail/401' }, { label: '403', path: '/fail/403' },
  { label: '404', path: '/fail/404' }, { label: '409', path: '/fail/409' }, { label: '422 (RFC 7807)', path: '/fail/422' },
  { label: '500', path: '/fail/500' }, { label: '503', path: '/fail/503' }, { label: 'Réseau', path: '/fail/0' },
  { label: 'Métier : BILLING_RESTRICTED', path: '/fail/business-billing' }, { label: 'Métier : QUOTA_EXCEEDED', path: '/fail/business-quota' },
];

@Component({
  selector: 'demo-api-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './page.css',
  template: `
    <h1>API, session et erreurs</h1>
    <p class="lead">Les intercepteurs convertissent chaque erreur HTTP en <code>ApiError</code> et affichent le toast adapté — aucun code dans les composants.</p>

    <div class="card">
      <p>Session : <strong>{{ session.status() }}</strong>
        @if (session.isAuthenticated()) { — utilisateur : <code>{{ userName() }}</code> }</p>
      <div class="row">
        <button type="button" class="btn btn--primary" (click)="login()" [disabled]="session.isAuthenticated()">Se connecter (mot de passe « demo »)</button>
        <button type="button" class="btn" (click)="badLogin()">Mauvais mot de passe</button>
        <button type="button" class="btn" (click)="session.logout({ redirect: false })" [disabled]="!session.isAuthenticated()">Se déconnecter</button>
      </div>
    </div>

    <h2>Provoquer une erreur</h2>
    <div class="row">
      @for (c of cases; track c.path) { <button type="button" class="btn" (click)="trigger(c.path)">{{ c.label }}</button> }
    </div>
    @if (last()) { <pre>{{ last() }}</pre> }
  `,
})
export class ApiPage {
  protected readonly session = inject(SessionService);
  private readonly api = inject(ApiService);
  protected readonly cases = CASES;
  protected readonly last = signal('');

  protected userName(): string { return ((this.session.user() as Record<string, unknown> | null)?.['name'] as string) ?? ''; }
  protected login(): void { this.session.login({ username: 'demo', password: 'demo' }).subscribe(); }
  protected badLogin(): void { this.session.login({ username: 'demo', password: 'nope' }).subscribe({ error: () => undefined }); }

  protected trigger(path: string): void {
    this.api.get(path).subscribe({
      error: (e: ApiError) => this.last.set(JSON.stringify({ kind: e.kind, status: e.status, code: e.code, message: e.message, fieldErrors: e.fieldErrors }, null, 2)),
    });
  }
}
