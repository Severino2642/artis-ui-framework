import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  HostListener,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewContainerRef,
  ComponentRef,
  Type,
  inject,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '@artis/api';
import { ArtAttrsDirective } from '../attrs/attrs.directive';
import { ArtInfoTipComponent } from '../../core/explanation/info-tip.component';
import { ART_UI_TEXTS } from '../../core/i18n/ui-texts';
import { uniqueId } from '../../core/util/unique-id';
import { ArtColorFieldComponent } from '../fields/color-field.component';
import { ArtFileFieldComponent } from '../fields/file-field.component';
import { ArtSecretFieldComponent } from '../fields/secret-field.component';
import { ART_FIELD_TYPES } from '../fields/field-renderer';
import {
  FieldButtonEvent,
  FieldType, FieldValidator,
  FormFieldConfig,
  ValidationResult
} from '../models/form-builder.model';

@Component({
  selector: 'art-form-field',
  standalone: true,
  imports: [CommonModule, FormsModule, ArtAttrsDirective, ArtInfoTipComponent, ArtColorFieldComponent, ArtSecretFieldComponent, ArtFileFieldComponent],
  templateUrl: './form-field.component.html',
  styleUrls: ['./form-field.component.css'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ArtFormFieldComponent implements OnInit, OnChanges, OnDestroy {

  @Input() config!: FormFieldConfig;
  @Input() value: any = undefined;
  @Output() valueChange = new EventEmitter<any>();

  /** When true: no label, compact sizing (used inside child table rows) */
  @Input() compact = false;

  /** All current sibling field values — forwarded in button events */
  @Input() formValues: Record<string, any> = {};

  @Output() buttonClick = new EventEmitter<FieldButtonEvent>();

  // ── Resolved config ──────────────────────────────────────────
  resolvedType: FieldType = 'text';
  resolvedLabel = '';
  resolvedValueKey = 'value';
  resolvedLabelKey = 'label';
  resolvedColSpan = 4;

  // ── Interval ─────────────────────────────────────────────────
  intervalMin: any = null;
  intervalMax: any = null;

  // ── Multiselect ──────────────────────────────────────────────
  selectedOptions: any[] = [];

  // ── Autocomplete ─────────────────────────────────────────────
  acQuery = '';
  acSuggestions: any[] = [];
  acLoading = false;
  acOpen = false;
  private acTimer: any;

  // ── Validation ───────────────────────────────────────────────
  /** Errors from the last validation run */
  validationErrors: ValidationResult[] = [];
  /** True while an async validator is running */
  isValidating = false;
  /** True once the field has been touched (blur or change) */
  isTouched = false;
  /** Used to debounce async validators */
  private validationTimer: any;

  private readonly cdr = inject(ChangeDetectorRef);
  private readonly api = inject(ApiService);
  protected readonly texts = inject(ART_UI_TEXTS);
  private readonly registry = inject(ART_FIELD_TYPES, { optional: true }) ?? [];

  /** `id` du contrôle principal : relie `<label for>`, `aria-describedby`, etc. */
  readonly inputId = uniqueId('art-ff');
  readonly errorsId = `${this.inputId}-err`;

  /** Types gérés nativement par ce composant. */
  private static readonly BUILTIN = ['text','number','date','time','datetime','color','select','multiselect','autocomplete','interval','textarea','file','secret'];

  /** Composant d'un type personnalisé (`provideArtFieldType`), sinon null. */
  customType: Type<unknown> | null = null;
  private customRef: ComponentRef<unknown> | null = null;
  private customVcr: ViewContainerRef | null = null;

  @ViewChild('customHost', { read: ViewContainerRef })
  set customHost(vcr: ViewContainerRef | undefined) {
    this.customVcr = vcr ?? null;
    this.mountCustom();
  }

  get describedBy(): string | null { return this.hasError ? this.errorsId : null; }
  get ariaInvalid(): 'true' | null { return this.hasError ? 'true' : null; }

  // ─────────────────────────────────────────── Lifecycle ───────

  ngOnInit(): void {
    this.resolve();
    this.initValue();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config']) { this.resolve(); this.initValue(); }
    if (changes['value'] && !changes['config']) this.syncFromValue();
    this.syncCustom();
  }

  // ─────────────────────────────────────────── Private ─────────

  private resolve(): void {
    const c = this.config;
    this.resolvedLabel    = c.label ?? c.name;
    this.resolvedType     = c.type  ?? this.inferType(c.defaultValue);
    this.resolvedValueKey = c.optionValueKey ?? 'value';
    this.resolvedLabelKey = c.optionLabelKey ?? 'label';
    this.resolvedColSpan  = c.colSpan ?? 4;
    this.customType = ArtFormFieldComponent.BUILTIN.includes(this.resolvedType)
      ? null
      : this.registry.find((r) => r.type === this.resolvedType)?.component ?? null;
    this.mountCustom();
  }

  /** (Re)crée le composant personnalisé et le relie aux entrées/sorties du contrat `ArtFieldBase`. */
  private mountCustom(): void {
    if (!this.customVcr || !this.customType) { this.customRef?.destroy(); this.customRef = null; return; }
    if (!this.customRef) {
      this.customVcr.clear();
      this.customRef = this.customVcr.createComponent(this.customType);
      const inst = this.customRef.instance as Record<string, { subscribe?: (fn: (v: any) => void) => unknown } | undefined>;
      inst['valueChange']?.subscribe?.((v) => this.onSimpleChange(v));
      inst['blurred']?.subscribe?.(() => this.onBlur());
    }
    this.syncCustom();
  }

  private syncCustom(): void {
    if (!this.customRef) return;
    const set = (k: string, v: unknown) => { try { this.customRef!.setInput(k, v); } catch { /* entrée non déclarée : ignorée */ } };
    set('config', this.config);
    set('value', this.value);
    set('inputId', this.inputId);
    set('readonly', !!this.config.isReadOnly);
    set('invalid', this.hasError);
    set('describedBy', this.describedBy);
    set('compact', this.compact);
    this.customRef.changeDetectorRef.markForCheck();
  }

  ngOnDestroy(): void {
    clearTimeout(this.acTimer);
    clearTimeout(this.validationTimer);
    this.customRef?.destroy();
  }

  private inferType(v: any): FieldType {
    if (v === null || v === undefined) return 'text';
    if (typeof v === 'number')  return 'number';
    if (typeof v === 'boolean') return 'select';
    if (v instanceof Date)      return 'date';
    return 'text';
  }

  private initValue(): void {
    const def = this.config.defaultValue;

    if (this.resolvedType === 'interval') {
      const iv = this.value ?? {};
      this.intervalMin = iv.min ?? def?.min ?? null;
      this.intervalMax = iv.max ?? def?.max ?? null;
      return;
    }
    if (this.resolvedType === 'multiselect') {
      this.selectedOptions = Array.isArray(this.value) ? [...this.value]
        : def ? [...(Array.isArray(def) ? def : [def])] : [];
      return;
    }
    if (this.resolvedType === 'autocomplete') {
      const display = this.value ? this.renderSuggestion(this.value) : '';
      this.acQuery = display !== '' && this.value ? display : this.value;
      return;
    }

    if (this.value === undefined && def !== undefined) {
      this.emit(def);
    }
  }

  private syncFromValue(): void {
    if (this.resolvedType === 'interval') {
      const iv = this.value ?? {};
      this.intervalMin = iv.min ?? null;
      this.intervalMax = iv.max ?? null;
    }
    if (this.resolvedType === 'multiselect') {
      this.selectedOptions = Array.isArray(this.value) ? [...this.value] : [];
    }
  }

  // ─────────────────────────────────────────── Emitters ────────

  emit(v: any): void {
    this.valueChange.emit(v);
    // Run validation on every value change (debounced for async)
    this.scheduleValidation(v);
  }

  onSimpleChange(v: any): void {
    this.isTouched = true;
    this.emit(v);
  }

  // ── Interval
  onIntervalChange(): void {
    this.isTouched = true;
    this.emit({ min: this.intervalMin, max: this.intervalMax });
  }

  // ── Multiselect
  toggleOption(optValue: any): void {
    const idx = this.selectedOptions.indexOf(optValue);
    if (idx === -1) this.selectedOptions.push(optValue);
    else            this.selectedOptions.splice(idx, 1);
    this.isTouched = true;
    this.emit([...this.selectedOptions]);
  }
  removeSelectedOption(optValue: any): void {
    this.selectedOptions = this.selectedOptions.filter(v => v !== optValue);
    this.isTouched = true;
    this.emit([...this.selectedOptions]);
  }
  isSelected(optValue: any): boolean {
    return this.selectedOptions.includes(optValue);
  }
  getLabelForValue(optValue: any): string {
    const opt = (this.config.options ?? []).find(o => o[this.resolvedValueKey] === optValue);
    return opt ? opt[this.resolvedLabelKey] : String(optValue);
  }

  // ── Autocomplete
  onAcInput(): void {
    clearTimeout(this.acTimer);
    if (!this.acQuery?.trim()) { this.acSuggestions = []; this.acOpen = false; return; }
    this.acTimer = setTimeout(() => this.runAcSearch(), 250);
  }

  private runAcSearch(): void {
    const q = this.acQuery.trim().toLowerCase();
    const data = this.config.autocompleteData;

    if (Array.isArray(data)) {
      this.acSuggestions = data.filter(item =>
        Object.values(item).some(v => String(v).toLowerCase().includes(q))
      ).slice(0, 8);
      this.acOpen = this.acSuggestions.length > 0;
      this.cdr.markForCheck();
    } else if (typeof data === 'string') {
      const param = this.config.autocompleteSearchParam ?? 'q';
      this.acLoading = true;
      // `cancelKey` : une nouvelle frappe annule la requête précédente (pas de résultats périmés).
      this.api.get<any[]>(data, { params: { [param]: this.acQuery }, cancelKey: `ac:${this.inputId}`, skipLoader: true }).subscribe({
        next: res => {
          this.acSuggestions = (res ?? []).slice(0, 8);
          this.acOpen        = this.acSuggestions.length > 0;
          this.acLoading     = false;
          this.cdr.markForCheck();
        },
        error: () => { this.acLoading = false; this.cdr.markForCheck(); },
      });
    }
  }

  triggerAcSearch(): void { this.runAcSearch(); }

  selectAcSuggestion(item: any): void {
    this.acQuery  = this.renderSuggestion(item);
    this.acOpen   = false;
    this.isTouched = true;
    this.emit(item);
    this.cdr.markForCheck();
  }

  renderSuggestion(item: any): string {
    const keys = this.config.autocompleteDisplayKeys;
    if (!keys || !item) return '';
    return keys.split(';')
      .map(k => item[k.trim()])
      .filter(v => v !== null && v !== undefined)
      .join(' · ');
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (this.acOpen && !(e.target as HTMLElement).closest('.ac-wrapper')) {
      this.acOpen = false;
      this.cdr.markForCheck();
    }
  }

  // ── Mark field as touched on blur (shows validation errors)
  onBlur(): void {
    this.isTouched = true;
    this.scheduleValidation(this.value);
  }

  // ── Boolean select options
  get booleanOptions() {
    return [
      { value: true,  label: this.texts.boolean.yes },
      { value: false, label: this.texts.boolean.no },
    ];
  }

  // ── Interval base type
  get intervalInputType(): string {
    const t = this.config.intervalBaseType ?? 'number';
    const map: Record<string, string> = {
      number:   'number',
      date:     'date',
      time:     'time',
      datetime: 'datetime-local',
    };
    return map[t] ?? 'number';
  }

  // ── Field button click
  onFieldButtonClick(btnId: string): void {
    this.buttonClick.emit({
      buttonId: btnId,
      fieldName: this.config.name,
      currentFieldValue: this.value,
      allFormValues: this.formValues,
    });
  }

  get isBooleanField(): boolean {
    return typeof this.config.defaultValue === 'boolean' && !this.config.type;
  }

  get isRequired(): boolean{
    return this.config.required === true || (this.config.validation?.validators.some(v => v.type === 'required') ?? false);
  }

  getBtnClass(variant?: string): string {
    const map: Record<string, string> = {
      primary: 'fb-btn--primary',
      danger:  'fb-btn--danger',
      success: 'fb-btn--success',
      default: 'fb-btn--default',
    };
    return map[variant ?? 'default'] ?? 'fb-btn--default';
  }

  // ═══════════════════════════════════════════ VALIDATION ══════

  /** True si le champ est en erreur ET a été touché */
  get hasError(): boolean {
    return this.isTouched && this.validationErrors.length > 0;
  }

  /** True si valide ET touché (pour afficher le ✓ vert) */
  get isValid(): boolean {
    return this.isTouched && this.validationErrors.length === 0 && !this.isValidating;
  }

  /**
   * Schedule validation with a 200ms debounce.
   * The debounce prevents hammering async validators on every keystroke.
   */
  private scheduleValidation(value: any): void {
    if (!this.config.validation) return;
    clearTimeout(this.validationTimer);
    this.validationTimer = setTimeout(() => this.runValidation(value), 200);
  }

  /**
   * Run all validators in order.
   * Supports both sync (fn) and async (asyncFn) validators.
   * stopOnFirstError halts the loop at the first failure.
   */
  private async runValidation(value: any): Promise<void> {
    const cfg = this.config.validation;
    if (!cfg) return;

    this.isValidating = true;
    this.cdr.markForCheck();

    const errors: ValidationResult[] = [];

    for (const v of cfg.validators) {
      const result = await this.runSingleValidator(v, value);
      if (!result.valid) {
        errors.push(result);
        if (cfg.stopOnFirstError) break;
      }
    }

    this.validationErrors = errors;
    this.isValidating = false;
    this.cdr.markForCheck();
  }

  /** Run one validator and return a ValidationResult */
  private async runSingleValidator(
    v: FieldValidator,
    value: any,
  ): Promise<ValidationResult> {

    const fail = (key: string, defaultMsg: string): ValidationResult => ({
      valid:    false,
      errorKey: key,
      message:  v.message ?? defaultMsg,
    });
    switch (v.type) {

      case 'required':
        if (
          value == null ||
          value === '' ||
          (Array.isArray(value) && !value.length)
        ) return fail('required', 'Ce champ est obligatoire');
        break;

      case 'minLength':
        if (String(value ?? '').length < (v.length ?? 0))
          return fail('minLength', `Minimum ${v.length} caractère(s)`);
        break;

      case 'maxLength':
        if (String(value ?? '').length > (v.length ?? Infinity))
          return fail('maxLength', `Maximum ${v.length} caractère(s)`);
        break;

      case 'min': {
        if (value == null) break;
        const isDate = value instanceof Date
          || (typeof value === 'string' && !isNaN(Date.parse(value)) && isNaN(Number(value)));
        if (isDate) {
          const dateValue = new Date(value);
          const dateMin   = new Date(v.value as string);
          if (dateValue < dateMin)
            return fail('min', `Date minimale : ${dateMin.toLocaleDateString('fr-FR')}`);
        } else {
          if (Number(value) < Number(v.value))
            return fail('min', `Valeur minimale : ${v.value}`);
        }
        break;
      }

      case 'max': {
        if (value == null) break;
        const isDate = value instanceof Date
          || (typeof value === 'string' && !isNaN(Date.parse(value)) && isNaN(Number(value)));
        if (isDate) {
          const dateValue = new Date(value);
          const dateMax   = new Date(v.value as string);
          if (dateValue > dateMax)
            return fail('max', `Date maximale : ${dateMax.toLocaleDateString('fr-FR')}`);
        } else {
          if (Number(value) > Number(v.value))
            return fail('max', `Valeur maximale : ${v.value}`);
        }
        break;
      }

      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)))
          return fail('email', 'Format email invalide');
        break;

      case 'url':
        if (value) {
          try { new URL(String(value)); }
          catch { return fail('url', 'URL invalide'); }
        }
        break;

      case 'pattern':
        if (value && !new RegExp(v.pattern ?? '', v.flags ?? '').test(String(value)))
          return fail('pattern', v.message ?? 'Format invalide');
        break;

      case 'custom':
        if (v.asyncFn) {
          try {
            const msg = await v.asyncFn(value, this.formValues);
            if (msg) return fail('custom', msg);
          } catch {
            return fail('custom', 'Erreur de validation');
          }
        } else if (v.fn) {
          const msg = v.fn(value, this.formValues);
          if (msg) return fail('custom', msg);
        }
        break;
    }

    return { valid: true };
  }

  /**
   * Public method — called by parent (ArtFormBuilderComponent) to
   * trigger validation on all fields before saving.
   * Returns true if the field is valid.
   */
  async validateNow(): Promise<boolean> {
    this.isTouched = true;
    await this.runValidation(this.value);
    return this.validationErrors.length === 0;
  }
}
