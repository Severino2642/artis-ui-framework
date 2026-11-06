import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { ToastService } from './toast.service';

/**
 * Conteneur de toasts (overlay fixe). À placer UNE fois, typiquement dans AppComponent :
 * `<art-toast-container />`.
 *
 * Accessibilité : chaque toast est une région `role="status"` (aria-live polite)
 * ou `role="alert"` (assertive) pour les erreurs/avertissements.
 */
@Component({
  selector: 'art-toast-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"art-toaster art-toaster--" + position()',
    'role': 'region',
    'aria-label': 'Notifications',
  },
  template: `
    @for (t of service.visible(); track t.id) {
      <div
        class="art-toast art-toast--{{ t.type }}"
        [class.art-toast--leaving]="t.leaving"
        [attr.role]="t.type === 'error' || t.type === 'warning' ? 'alert' : 'status'"
        [attr.aria-live]="t.type === 'error' || t.type === 'warning' ? 'assertive' : 'polite'"
        aria-atomic="true"
        (mouseenter)="service.pause(t.id)"
        (mouseleave)="service.resume(t.id)"
        (focusin)="service.pause(t.id)"
        (focusout)="service.resume(t.id)"
      >
        <span class="art-toast__icon material-symbols-outlined" aria-hidden="true">{{ t.icon }}</span>
        <div class="art-toast__body">
          @if (t.title) { <p class="art-toast__title">{{ t.title }}</p> }
          <p class="art-toast__message">{{ t.message }}</p>
          @if (t.action) {
            <button type="button" class="art-toast__action" (click)="service.runAction(t.id)">{{ t.action.label }}</button>
          }
        </div>
        @if (t.dismissible) {
          <button type="button" class="art-toast__close" [attr.aria-label]="service.config.closeLabel" (click)="service.dismiss(t.id)">
            <span class="material-symbols-outlined" aria-hidden="true">close</span>
          </button>
        }
      </div>
    }
    @if (service.queued() > 0) {
      <p class="art-toaster__queue" role="status">+{{ service.queued() }}</p>
    }
  `,
  styleUrl: './toast-container.component.css',
})
export class ToastContainerComponent {
  protected readonly service = inject(ToastService);
  protected readonly position = computed(() => this.service.config.position);
}
