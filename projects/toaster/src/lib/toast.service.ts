import { Injectable, InjectionToken, computed, inject, signal, EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { DEFAULT_TOASTER_CONFIG, TOAST_ICONS, Toast, ToastOptions, ToastType, ToasterConfig } from './toast.models';

export const TOASTER_CONFIG = new InjectionToken<ToasterConfig>('TOASTER_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_TOASTER_CONFIG,
});

/** Configure le toaster : `provideToaster({ position: 'bottom-right', maxVisible: 3 })`. */
export function provideToaster(config: Partial<ToasterConfig> = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: TOASTER_CONFIG,
      useValue: {
        ...DEFAULT_TOASTER_CONFIG,
        ...config,
        durations: { ...DEFAULT_TOASTER_CONFIG.durations, ...config.durations },
        titles: { ...DEFAULT_TOASTER_CONFIG.titles, ...config.titles },
      } satisfies ToasterConfig,
    },
  ]);
}

type Msg = string | ToastOptions;

/**
 * Service de notifications.
 *
 * ```ts
 * toast.success('Client enregistré');
 * toast.error({ message: 'Échec', action: { label: 'Réessayer', handler: () => this.retry() } });
 * ```
 * Les toasts sont rendus par `<art-toast-container />` (à placer une fois dans l'app).
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly config = inject(TOASTER_CONFIG);

  private seq = 0;
  private readonly timers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly _all = signal<Toast[]>([]);

  /** Tous les toasts (visibles + en file). */
  readonly all = this._all.asReadonly();
  /** Toasts effectivement affichés (limités à `maxVisible`). */
  readonly visible = computed(() => this._all().slice(0, this.config.maxVisible));
  /** Nombre de toasts en attente. */
  readonly queued = computed(() => Math.max(0, this._all().length - this.config.maxVisible));

  success(msg: Msg): string { return this.show('success', msg); }
  error(msg: Msg): string { return this.show('error', msg); }
  warning(msg: Msg): string { return this.show('warning', msg); }
  info(msg: Msg): string { return this.show('info', msg); }

  /** Affiche un toast et retourne son identifiant. */
  show(type: ToastType, msg: Msg): string {
    const o: ToastOptions = typeof msg === 'string' ? { message: msg } : msg;
    const id = o.id ?? `art-toast-${++this.seq}`;

    // Dédoublonnage : même id ⇒ on remplace le contenu et on relance la minuterie.
    const existing = this._all().find((t) => t.id === id);
    const toast: Toast = {
      id,
      type,
      message: o.message,
      title: o.title ?? this.config.titles[type],
      duration: o.duration ?? this.config.durations[type],
      action: o.action,
      dismissible: o.dismissible ?? true,
      icon: o.icon ?? TOAST_ICONS[type],
      leaving: false,
      createdAt: Date.now(),
    };
    if (existing) {
      this._all.update((list) => list.map((t) => (t.id === id ? toast : t)));
    } else {
      this._all.update((list) => [...list, toast]);
    }
    this.armTimer(toast);
    return id;
  }

  /** Ferme un toast (avec animation de sortie). */
  dismiss(id: string): void {
    const t = this._all().find((x) => x.id === id);
    if (!t || t.leaving) return;
    this.clearTimer(id);
    this._all.update((list) => list.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
    const ms = this.config.leaveAnimationMs;
    if (ms <= 0) this.remove(id);
    else setTimeout(() => this.remove(id), ms);
  }

  /** Ferme tous les toasts. */
  clear(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers.clear();
    this._all.set([]);
  }

  /** Suspend la minuterie (survol / focus) — WCAG 2.2.1 « durée réglable ». */
  pause(id: string): void { this.clearTimer(id); }

  /** Relance la minuterie après un survol / focus. */
  resume(id: string): void {
    const t = this._all().find((x) => x.id === id);
    if (t && !t.leaving) this.armTimer(t);
  }

  runAction(id: string): void {
    const t = this._all().find((x) => x.id === id);
    if (!t?.action) return;
    t.action.handler();
    if (!t.action.keepOpen) this.dismiss(id);
  }

  private remove(id: string): void {
    this._all.update((list) => list.filter((t) => t.id !== id));
  }

  private armTimer(t: Toast): void {
    this.clearTimer(t.id);
    if (t.duration > 0) {
      this.timers.set(t.id, setTimeout(() => this.dismiss(t.id), t.duration));
    }
  }

  private clearTimer(id: string): void {
    const timer = this.timers.get(id);
    if (timer) { clearTimeout(timer); this.timers.delete(id); }
  }
}
