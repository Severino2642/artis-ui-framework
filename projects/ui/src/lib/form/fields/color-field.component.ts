import {
  ChangeDetectionStrategy, Component, ElementRef, HostListener, Injector, afterNextRender, computed, effect, inject, signal, untracked, viewChild,
} from '@angular/core';
import { ART_UI_TEXTS } from '../../core/i18n/ui-texts';
import { closeTopLayer, openTopLayer, trackViewport } from '../../core/util/top-layer';
import { uniqueId } from '../../core/util/unique-id';
import { Hsv, hsvToRgb, parseColor, readableOn, rgbToHex, rgbToHsl, rgbToHsv, hslToRgb, Rgb } from './color-utils';
import { ART_COLOR_PALETTE, ArtFieldBase } from './field-renderer';

/**
 * Champ `color` : aperçu + code hexadécimal éditable + sélecteur avancé (zone S/V, teinte, RVB, TSL, palette).
 * La valeur émise est toujours un hexadécimal `#RRGGBB` (majuscules), mise à jour EN TEMPS RÉEL pendant la sélection.
 */
@Component({
  selector: 'art-color-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cf" [class.cf--invalid]="invalid() || textInvalid()">
      <button
        #trigger
        type="button"
        class="cf__swatch"
        [class.cf__swatch--empty]="!rgb()"
        [style.background]="hex() || null"
        [disabled]="readonly()"
        aria-haspopup="dialog"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="panelId"
        [attr.aria-label]="texts.color.open + (hex() ? ' (' + hex() + ')' : '')"
        (click)="toggle()"
      >
        @if (!rgb()) { <span class="material-symbols-outlined" aria-hidden="true">palette</span> }
      </button>
      <input
        class="cf__text"
        type="text"
        spellcheck="false"
        autocomplete="off"
        maxlength="22"
        [id]="inputId()"
        [value]="draft()"
        [readOnly]="readonly()"
        [attr.aria-invalid]="invalid() || textInvalid() ? 'true' : null"
        [attr.aria-describedby]="textInvalid() ? errId : describedBy()"
        [placeholder]="'#RRGGBB'"
        (input)="onText($any($event.target).value)"
        (blur)="onTextBlur()"
      />
    </div>
    @if (textInvalid()) { <p class="cf__err" [id]="errId" role="alert">{{ texts.color.invalid }}</p> }

    @if (open()) {
      <div #panel class="cf__panel" popover="manual" role="dialog" [id]="panelId" [attr.aria-label]="texts.color.open"
           [style.top.px]="pos().top" [style.left.px]="pos().left" (keydown.escape)="close(true, $event)">
        <div class="cf__sv" #sv [style.background-color]="'hsl(' + hsv().h + ' 100% 50%)'"
             (pointerdown)="svDown($event)" (pointermove)="svMove($event)" (pointerup)="svUp($event)" aria-hidden="true">
          <span class="cf__sv-thumb" [style.left.%]="hsv().s" [style.top.%]="100 - hsv().v" [style.background]="hex()"></span>
        </div>
        <label class="cf__row">
          <span class="art-sr-only">{{ texts.color.hue }}</span>
          <input class="cf__hue" type="range" min="0" max="360" step="1" [value]="hsv().h" [attr.aria-label]="texts.color.hue"
                 (input)="setHue(+$any($event.target).value)" />
        </label>

        <div class="cf__grid">
          <label class="cf__field cf__field--hex"><span>{{ texts.color.hex }}</span>
            <input type="text" #hexInput spellcheck="false" [value]="hex()" (change)="setFromText($any($event.target).value)" /></label>
        </div>
        <div class="cf__grid cf__grid--3">
          <label class="cf__field"><span>R</span><input type="number" min="0" max="255" [value]="rgb()?.r ?? 0" [attr.aria-label]="texts.color.rgb + ' R'" (input)="setRgb('r', +$any($event.target).value)" /></label>
          <label class="cf__field"><span>G</span><input type="number" min="0" max="255" [value]="rgb()?.g ?? 0" [attr.aria-label]="texts.color.rgb + ' G'" (input)="setRgb('g', +$any($event.target).value)" /></label>
          <label class="cf__field"><span>B</span><input type="number" min="0" max="255" [value]="rgb()?.b ?? 0" [attr.aria-label]="texts.color.rgb + ' B'" (input)="setRgb('b', +$any($event.target).value)" /></label>
        </div>
        <div class="cf__grid cf__grid--3">
          <label class="cf__field"><span>H</span><input type="number" min="0" max="360" [value]="hslv().h" [attr.aria-label]="texts.color.hsl + ' H'" (input)="setHsl('h', +$any($event.target).value)" /></label>
          <label class="cf__field"><span>S%</span><input type="number" min="0" max="100" [value]="hslv().s" [attr.aria-label]="texts.color.hsl + ' S'" (input)="setHsl('s', +$any($event.target).value)" /></label>
          <label class="cf__field"><span>L%</span><input type="number" min="0" max="100" [value]="hslv().l" [attr.aria-label]="texts.color.hsl + ' L'" (input)="setHsl('l', +$any($event.target).value)" /></label>
        </div>

        @if (palette().length) {
          <div class="cf__palette" role="group" [attr.aria-label]="texts.color.palette">
            @for (c of palette(); track c) {
              <button type="button" class="cf__chip" [class.cf__chip--on]="c.toUpperCase() === hex()" [style.background]="c"
                      [attr.aria-label]="c" [attr.aria-pressed]="c.toUpperCase() === hex()" (click)="setFromText(c)"></button>
            }
          </div>
        }

        <div class="cf__foot">
          <span class="cf__preview" [style.background]="hex()" [style.color]="onColor()" [attr.aria-label]="texts.color.preview">{{ hex() }}</span>
          <button type="button" class="cf__done" (click)="close(true)">{{ texts.color.close }}</button>
        </div>
      </div>
    }
  `,
  styleUrl: './color-field.component.css',
})
export class ArtColorFieldComponent extends ArtFieldBase {
  protected readonly texts = inject(ART_UI_TEXTS);
  private readonly defaultPalette = inject(ART_COLOR_PALETTE);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  protected readonly panelId = uniqueId('art-color-panel');
  protected readonly errId = uniqueId('art-color-err');
  protected readonly open = signal(false);
  protected readonly pos = signal({ top: 0, left: 0 });
  protected readonly draft = signal('');
  protected readonly textInvalid = signal(false);
  protected readonly hsv = signal<Hsv>({ h: 0, s: 0, v: 0 });

  private readonly trigger = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panelEl = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly svEl = viewChild<ElementRef<HTMLElement>>('sv');
  private readonly hexInput = viewChild<ElementRef<HTMLInputElement>>('hexInput');
  private dragging = false;

  protected readonly palette = computed(() => this.config().colorPalette ?? this.defaultPalette);
  protected readonly rgb = computed<Rgb | null>(() => parseColor(this.value() as string));
  protected readonly hex = computed(() => { const c = this.rgb(); return c ? rgbToHex(c) : ''; });
  protected readonly hslv = computed(() => { const c = this.rgb(); return c ? rgbToHsl(c) : { h: 0, s: 0, l: 0 }; });
  protected readonly onColor = computed(() => {
    const c = this.rgb();
    return c && readableOn(c) === 'dark' ? 'var(--art-neutral-900)' : 'var(--art-white)';
  });

  constructor() {
    super();
    // Synchronise l'état interne quand la valeur change de l'extérieur.
    // Seules `rgb()`/`hex()` (dérivées de la valeur) sont suivies ; l'état interne est lu/écrit via `untracked` (pas de boucle).
    effect(() => {
      const c = this.rgb();
      const hex = this.hex();
      untracked(() => {
        if (c) {
          // Conserve la teinte courante si la couleur est grise (s=0) pour éviter de « sauter » à 0°.
          const next = rgbToHsv(c);
          const cur = this.hsv();
          this.hsv.set(next.s === 0 || next.v === 0 ? { ...next, h: cur.h } : next);
        }
        if (!this.textInvalid()) this.draft.set(hex);
      });
    });
  }

  protected toggle(): void { this.open() ? this.close(false) : this.show(); }

  private show(): void {
    this.open.set(true);
    afterNextRender(() => { openTopLayer(this.panelEl()?.nativeElement); this.place(); this.hexInput()?.nativeElement.focus({ preventScroll: true }); }, { injector: this.injector });
  }

  protected close(refocus: boolean, ev?: Event): void {
    ev?.stopPropagation();
    closeTopLayer(this.panelEl()?.nativeElement);
    this.open.set(false);
    if (refocus) this.trigger().nativeElement.focus();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: Event): void {
    if (this.open() && !this.host.nativeElement.contains(e.target as Node) && !this.panelEl()?.nativeElement.contains(e.target as Node)) this.close(false);
  }

  /** Repositionne le panneau au redimensionnement / défilement de n'importe quel conteneur. */
  private readonly trackEffect = effect((onCleanup) => {
    if (this.open()) onCleanup(trackViewport(() => this.place()));
  });

  private place(): void {
    const panel = this.panelEl()?.nativeElement;
    if (!panel) return;
    const b = this.trigger().nativeElement.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const m = 8;
    let left = Math.min(Math.max(m, b.left), window.innerWidth - p.width - m);
    let top = b.bottom + 6;
    if (top + p.height > window.innerHeight - m && b.top - p.height - 6 > m) top = b.top - p.height - 6;
    this.pos.set({ top, left: Math.max(m, left) });
  }

  // ── Saisie texte ───────────────────────────────────────────
  protected onText(raw: string): void {
    this.draft.set(raw);
    if (!raw.trim()) { this.textInvalid.set(false); this.valueChange.emit(''); return; }
    const c = parseColor(raw);
    if (c) { this.textInvalid.set(false); this.emitRgb(c); } else this.textInvalid.set(true);
  }

  protected onTextBlur(): void {
    this.blurred.emit();
  }

  protected setFromText(raw: string): void {
    const c = parseColor(raw);
    if (c) { this.textInvalid.set(false); this.emitRgb(c); }
  }

  // ── Sélecteur ──────────────────────────────────────────────
  protected setHue(h: number): void {
    const cur = this.hsv();
    this.applyHsv({ ...cur, h });
  }

  protected setRgb(k: 'r' | 'g' | 'b', v: number): void {
    if (Number.isNaN(v)) return;
    const base = this.rgb() ?? { r: 0, g: 0, b: 0 };
    this.emitRgb({ ...base, [k]: Math.min(255, Math.max(0, v)) });
  }

  protected setHsl(k: 'h' | 's' | 'l', v: number): void {
    if (Number.isNaN(v)) return;
    const base = this.hslv();
    const max = k === 'h' ? 360 : 100;
    this.emitRgb(hslToRgb({ ...base, [k]: Math.min(max, Math.max(0, v)) }));
  }

  protected svDown(e: PointerEvent): void {
    this.dragging = true;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    this.svPick(e);
  }
  protected svMove(e: PointerEvent): void { if (this.dragging) this.svPick(e); }
  protected svUp(e: PointerEvent): void {
    this.dragging = false;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  }

  private svPick(e: PointerEvent): void {
    const el = this.svEl()?.nativeElement;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const s = Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / (r.width || 1))) * 100);
    const v = Math.round((1 - Math.min(1, Math.max(0, (e.clientY - r.top) / (r.height || 1)))) * 100);
    this.applyHsv({ h: this.hsv().h, s, v });
  }

  private applyHsv(hsv: Hsv): void {
    this.hsv.set(hsv);
    this.textInvalid.set(false);
    this.valueChange.emit(rgbToHex(hsvToRgb(hsv)));
  }

  private emitRgb(c: Rgb): void {
    this.valueChange.emit(rgbToHex(c));
  }
}
