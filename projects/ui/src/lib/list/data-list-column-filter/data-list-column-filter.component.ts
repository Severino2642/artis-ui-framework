import {
  ChangeDetectionStrategy, Component, ElementRef, HostListener, Injector, afterNextRender, computed, effect, inject, input, output, signal, viewChild,
} from '@angular/core';
import { ART_UI_TEXTS } from '../../core/i18n/ui-texts';
import { closeTopLayer, openTopLayer, trackViewport } from '../../core/util/top-layer';
import { uniqueId } from '../../core/util/unique-id';
import { ArtFormFieldComponent } from '../../form/form-field/form-field.component';
import { FormFieldConfig } from '../../form/models/form-builder.model';

/**
 * Filtre d'UNE colonne : une icône dans l'en-tête ouvre un petit panneau (champ adapté au type de la colonne).
 * Émet `applied` avec la valeur saisie, ou `null` pour retirer le filtre.
 * Utilisé automatiquement par `<art-dl-table>` pour les colonnes `filterable`.
 */
@Component({
  selector: 'art-dl-column-filter',
  standalone: true,
  imports: [ArtFormFieldComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button #btn type="button" class="cfl__btn" [class.cfl__btn--on]="active()" aria-haspopup="dialog"
            [attr.aria-expanded]="open()" [attr.aria-controls]="panelId" [attr.aria-label]="texts.list.filterColumn(label())"
            [title]="texts.list.filterColumn(label())" (click)="toggle($event)">
      <span class="material-symbols-outlined" aria-hidden="true">{{ active() ? 'filter_alt' : 'filter_list' }}</span>
    </button>
    @if (open()) {
      <div #panel class="cfl__panel" popover="manual" role="dialog" [id]="panelId" [attr.aria-label]="texts.list.filterColumn(label())"
           [style.top.px]="pos().top" [style.left.px]="pos().left" (keydown.enter)="apply($event)" (keydown.escape)="close(true, $event)">
        <art-form-field [config]="field()" [value]="draft()" (valueChange)="draft.set($event)" />
        <div class="cfl__actions">
          <button type="button" class="cfl__clear" (click)="clear()">{{ texts.list.clear }}</button>
          <button type="button" class="cfl__apply" (click)="apply()">{{ texts.list.apply }}</button>
        </div>
      </div>
    }
  `,
  styleUrl: './data-list-column-filter.component.css',
})
export class ArtDataListColumnFilterComponent {
  protected readonly texts = inject(ART_UI_TEXTS);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  /** Champ de filtre (type, options…). */
  readonly field = input.required<FormFieldConfig>();
  /** Valeur actuellement appliquée (pour l'état « actif » et le pré-remplissage). */
  readonly value = input<unknown>(null);
  /** Titre de la colonne (nom accessible du bouton). */
  readonly label = input('');
  readonly applied = output<unknown>();

  protected readonly panelId = uniqueId('art-cfl');
  protected readonly open = signal(false);
  protected readonly draft = signal<unknown>(null);
  protected readonly pos = signal({ top: 0, left: 0 });
  protected readonly active = computed(() => hasValue(this.value()));

  private readonly btn = viewChild.required<ElementRef<HTMLButtonElement>>('btn');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  constructor() {
    effect((onCleanup) => { if (this.open()) onCleanup(trackViewport(() => this.place())); });
  }

  protected toggle(e: Event): void {
    e.stopPropagation();
    if (this.open()) { this.close(false); return; }
    const v = this.value();
    this.draft.set(v && typeof v === 'object' && !Array.isArray(v) ? { ...(v as object) } : Array.isArray(v) ? [...v] : v ?? null);
    this.open.set(true);
    afterNextRender(() => { openTopLayer(this.panel()?.nativeElement); this.place(); this.panel()?.nativeElement.querySelector<HTMLElement>('input,select,textarea')?.focus({ preventScroll: true }); }, { injector: this.injector });
  }

  protected apply(e?: Event): void {
    e?.preventDefault();
    const d = this.draft();
    this.applied.emit(hasValue(d) ? d : null);
    this.close(true);
  }

  protected clear(): void {
    this.applied.emit(null);
    this.close(true);
  }

  protected close(refocus: boolean, e?: Event): void {
    e?.stopPropagation();
    closeTopLayer(this.panel()?.nativeElement);
    this.open.set(false);
    if (refocus) this.btn().nativeElement.focus();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    const t = e.target as Node;
    if (this.open() && !this.host.nativeElement.contains(t) && !this.panel()?.nativeElement.contains(t)) this.close(false);
  }

  private place(): void {
    const p = this.panel()?.nativeElement;
    if (!p) return;
    const b = this.btn().nativeElement.getBoundingClientRect();
    const r = p.getBoundingClientRect();
    const m = 8;
    const left = Math.max(m, Math.min(b.left, window.innerWidth - r.width - m));
    let top = b.bottom + 6;
    if (top + r.height > window.innerHeight - m && b.top - r.height - 6 > m) top = b.top - r.height - 6;
    this.pos.set({ top, left });
  }
}

function hasValue(v: unknown): boolean {
  if (v === null || v === undefined || v === '') return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'object') return Object.values(v as object).some((x) => x !== null && x !== undefined && x !== '');
  return true;
}
