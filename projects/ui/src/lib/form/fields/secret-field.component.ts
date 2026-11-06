import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ToastService } from '@artis/toaster';
import { ART_UI_TEXTS } from '../../core/i18n/ui-texts';
import { ArtFieldBase } from './field-renderer';

/**
 * Champ `secret` (mot de passe, jeton, clé d'API) : valeur masquée par défaut, copie en un clic,
 * révélation temporaire optionnelle. Lecture seule ou éditable.
 *
 * Sécurité : la valeur n'est jamais écrite dans les logs ; en lecture seule masquée, elle n'est PAS présente dans le DOM
 * (seul le masque l'est) ; la révélation se referme automatiquement (`secretRevealTimeout`).
 */
@Component({
  selector: 'art-secret-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sf" [class.sf--invalid]="invalid()" [class.sf--ro]="readonly()">
      @if (readonly()) {
        <span class="sf__display" [id]="inputId()" role="textbox" aria-readonly="true" tabindex="0"
              [attr.aria-label]="config().label ?? config().name" [attr.aria-describedby]="describedBy()"
              [class.sf__display--revealed]="revealed()">{{ displayText() }}</span>
      } @else {
        <input class="sf__input" [id]="inputId()" [type]="revealed() ? 'text' : 'password'" autocomplete="new-password"
               autocapitalize="off" spellcheck="false" [value]="str()"
               [attr.aria-invalid]="invalid() ? 'true' : null" [attr.aria-describedby]="describedBy()"
               (input)="valueChange.emit($any($event.target).value)" (blur)="blurred.emit()" />
      }
      @if (revealable()) {
        <button type="button" class="sf__btn" [attr.aria-pressed]="revealed()" [attr.aria-label]="revealed() ? texts.secret.hide : texts.secret.show"
                [title]="revealed() ? texts.secret.hide : texts.secret.show" (click)="toggleReveal()">
          <span class="material-symbols-outlined" aria-hidden="true">{{ revealed() ? 'visibility_off' : 'visibility' }}</span>
        </button>
      }
      @if (copyable()) {
        <button type="button" class="sf__btn" [class.sf__btn--ok]="copied()" [disabled]="!str()" [attr.aria-label]="texts.secret.copy"
                [title]="texts.secret.copy" (click)="copy()">
          <span class="material-symbols-outlined" aria-hidden="true">{{ copied() ? 'check' : 'content_copy' }}</span>
        </button>
      }
      <span class="art-sr-only" role="status" aria-live="polite">{{ announce() }}</span>
    </div>
  `,
  styleUrl: './secret-field.component.css',
})
export class ArtSecretFieldComponent extends ArtFieldBase {
  protected readonly texts = inject(ART_UI_TEXTS);
  private readonly toast = inject(ToastService);

  protected readonly revealed = signal(false);
  protected readonly copied = signal(false);
  protected readonly announce = signal('');
  private revealTimer: ReturnType<typeof setTimeout> | null = null;
  private copyTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly str = computed(() => {
    const v = this.value();
    return v === null || v === undefined ? '' : String(v);
  });
  protected readonly copyable = computed(() => this.config().secretCopyable !== false);
  protected readonly revealable = computed(() => this.config().secretRevealable === true);

  /** Texte affiché en lecture seule : masque (jamais la valeur) tant que non révélé. */
  protected readonly displayText = computed(() => {
    const v = this.str();
    if (!v) return this.texts.secret.empty;
    if (this.revealed()) return v;
    const c = this.config();
    const n = c.secretMaskMode === 'length' ? v.length : c.secretMaskLength ?? 10;
    return '•'.repeat(Math.max(1, n));
  });

  constructor() {
    super();
    inject(DestroyRef).onDestroy(() => {
      if (this.revealTimer) clearTimeout(this.revealTimer);
      if (this.copyTimer) clearTimeout(this.copyTimer);
    });
  }

  protected toggleReveal(): void {
    const next = !this.revealed();
    this.revealed.set(next);
    if (this.revealTimer) { clearTimeout(this.revealTimer); this.revealTimer = null; }
    const ms = this.config().secretRevealTimeout ?? 10000;
    if (next && ms > 0) this.revealTimer = setTimeout(() => this.revealed.set(false), ms);
  }

  protected async copy(): Promise<void> {
    const v = this.str();
    if (!v) return;
    const ok = await writeClipboard(v);
    const fb = this.config().secretCopyFeedback ?? 'icon';
    if (ok) {
      if (fb !== 'toast') {
        this.copied.set(true);
        if (this.copyTimer) clearTimeout(this.copyTimer);
        this.copyTimer = setTimeout(() => this.copied.set(false), 2000);
      }
      if (fb !== 'icon') this.toast.success({ id: 'art-secret-copied', message: this.texts.secret.copied, duration: 2000 });
      this.announce.set(this.texts.secret.copied);
    } else {
      this.toast.error({ id: 'art-secret-copy-failed', message: this.texts.secret.copyFailed });
      this.announce.set(this.texts.secret.copyFailed);
    }
  }
}

/** Copie dans le presse-papiers (API moderne, repli `execCommand`). Retourne false en cas d'échec. Ne journalise rien. */
export async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; }
  } catch { /* repli ci-dessous */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}
