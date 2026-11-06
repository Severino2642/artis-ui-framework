import { ArtLabelComponent } from '../../core/explanation/label.component';
import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  HostListener, ViewChildren, QueryList, inject,
} from '@angular/core';
import { ToastService } from '@artis/toaster';
import { ART_UI_TEXTS } from '../../core/i18n/ui-texts';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ArtFormFieldComponent } from '../form-field/form-field.component';
import { ArtFormChildComponent } from '../form-child/form-child.component';
import {
  ActionButtonConfig,
  ChildFormConfig,
  FieldButtonEvent,
  FormActionEvent,
  FormConfig, FormFieldConfig, FormFooterConfig
} from '../models/form-builder.model';
import {ArtFormBuilderService} from '../services/form-builder/form-builder.service';

@Component({
  selector: 'art-form-builder',
  standalone: true,
  imports: [ArtLabelComponent, CommonModule, FormsModule, ArtFormFieldComponent, ArtFormChildComponent],
  templateUrl: './form-builder.component.html',
  styleUrls: ['./form-builder.component.css'],
})
export class ArtFormBuilderComponent implements OnInit, OnChanges {
  private readonly toast = inject(ToastService);
  private readonly texts = inject(ART_UI_TEXTS);

  // ── Config inputs ─────────────────────────────────────────────
  /** Formulaire mère — optionnel. Si absent, les boutons d'action
   *  migrent en footer du formulaire fille (fc-wrapper). */
  @Input() config?: FormConfig;
  @Input() childConfig?: ChildFormConfig;
  @Input() isEditMode?: boolean = false;
  /** Pre-populate parent form values (for edit mode) */
  @Input() initialValues?: Record<string, any>;

  /** Pre-populate child rows (for edit mode) */
  @Input() initialChildRows?: Record<string, any>[];

  // ── Outputs ───────────────────────────────────────────────────
  /** Emitted on save, reset, or any extra button click */
  @Output() formAction = new EventEmitter<FormActionEvent>();

  /** Emitted when a field-level button is clicked */
  @Output() fieldButtonClick = new EventEmitter<FieldButtonEvent>();

  /** Emitted when a child-level field button is clicked */
  @Output() childFieldButtonClick = new EventEmitter<FieldButtonEvent & { rowIndex: number }>();

  @ViewChildren(ArtFormFieldComponent)
  fieldComponents!: QueryList<ArtFormFieldComponent>;

  // ── Internal state ────────────────────────────────────────────
  /** Flat map of all field values: { fieldName → value } */
  parentValues: Record<string, any> = {};

  /** Array of child rows */
  childRows: Record<string, any>[] = [];

  /** Track collapsed sections */
  collapsedSections = new Set<number>();

  /** Mobile breakpoint */
  isMobile = false;

  constructor(
    private cdr: ChangeDetectorRef,
    public formBuilderService: ArtFormBuilderService
  ) {}

  @HostListener('window:resize')
  onResize(): void {
    this.checkViewport();
    this.cdr.markForCheck();
  }

  private checkViewport(): void {
    this.isMobile = window.innerWidth < 768;
  }

  // ─────────────────────────────────────────── Lifecycle ───────

  ngOnInit(): void {
    this.checkViewport();
    this.initValues();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config'] || changes['initialValues']) this.initValues();
    if (changes['initialChildRows'] && this.initialChildRows) {
      this.childRows = [...this.initialChildRows];
    }
  }

  // ─────────────────────────────────────────── Init ────────────

  private initValues(): void {
    if (this.initialChildRows) {
      this.childRows = [...this.initialChildRows];
    }

    if (!this.config) return;

    const newValues: Record<string, any> = {};

    for (const section of this.config.sections) {
      for (const field of section.fields) {
        const key = field.name;
        // Pre-filled value → initialValues → defaultValue → null
        if (this.initialValues && key in this.initialValues) {
          newValues[key] = this.initialValues[key];
        } else if (field.defaultValue !== undefined) {
          newValues[key] = field.defaultValue;
        } else {
          newValues[key] = null;
        }
      }
      // Track collapsed state
      if (section.collapsed) {
        this.collapsedSections.add(this.config.sections.indexOf(section));
      }
    }

    this.parentValues = newValues;
  }

  // ─────────────────────────────────────────── Field updates ───

  onFieldChange(fieldName: string, value: any): void {
    this.parentValues = { ...this.parentValues, [fieldName]: value };
  }

  onChildRowsChange(rows: Record<string, any>[]): void {
    this.childRows = rows;
  }

  // ─────────────────────────────────────────── Section toggle ──

  toggleSection(index: number): void {
    if (this.collapsedSections.has(index)) this.collapsedSections.delete(index);
    else this.collapsedSections.add(index);
    this.cdr.markForCheck();
  }

  isSectionCollapsed(index: number): boolean {
    return this.collapsedSections.has(index);
  }

  // ─────────────────────────────────────────── Actions ─────────

  async onSave(): Promise<void> {
    const results = await Promise.all(
      this.fieldComponents.map(fc => fc.validateNow())
    );
    const allValid = results.every(r => r);

    if (!allValid) {
      this.toast.warning({ id: 'art-form-invalid', message: this.texts.form.invalid });
      return;
    }

    this.formAction.emit({
      buttonId: 'save',
      parentValues: { ...this.parentValues },
      childValues: [...this.getChildRowsSelected()],
    });
  }

  getChildRowsSelected(){
    return this.childRows.filter(row => row['selected']);
  }

  onReset(): void {
    this.initValues();
    this.childRows = this.initialChildRows ? [...this.initialChildRows] : [];
    this.formAction.emit({
      buttonId: 'reset',
      parentValues: { ...this.parentValues },
      childValues: [...this.childRows],
    });
    this.cdr.markForCheck();
  }

  onExtraButtonClick(btn: ActionButtonConfig): void {
    this.formAction.emit({
      buttonId: btn.id,
      parentValues: { ...this.parentValues },
      childValues: [...this.childRows],
    });
  }

  // ─────────────────────────────────────────── Field buttons ───

  onFieldButtonClick(event: FieldButtonEvent): void {
    this.fieldButtonClick.emit(event);
  }

  onChildFieldButtonClick(event: FieldButtonEvent & { rowIndex: number }): void {
    this.childFieldButtonClick.emit(event);
  }

  /**
   * Called from parent to set a field value programmatically.
   * Useful when a field button opens a popup and returns a selected value.
   */
  async validateField(fieldName: string): Promise<boolean> {
    const fieldComp = this.fieldComponents.find(fc => fc.config.name === fieldName);
    if (fieldComp) {
      fieldComp.value = this.parentValues[fieldName];
      return await fieldComp.validateNow();
    }
    return false;
  }

  setFieldValue(fieldName: string, value: any): void {
    this.parentValues = { ...this.parentValues, [fieldName]: value };
    this.validateField(fieldName);
    this.cdr.markForCheck();
  }

  setFieldOption(fieldName:string, options: { value: any, label: string }[]): void {
    this.config?.sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.name === fieldName) {
          field.options = options;
        }
      });
    });
    this.cdr.markForCheck();
  }

  setFieldDefaultValues(fieldName:string, defaultValue: any): void {
    this.config?.sections.forEach(section => {
      section.fields.forEach(field => {
        if (field.name === fieldName) {
          field.defaultValue = defaultValue;
        }
      });
    });
    this.setFieldValue(fieldName, defaultValue);
    this.cdr.markForCheck();
  }

  // ─────────────────────────────────────────── Helpers ─────────

  /** Vrai si le formulaire mère est configuré avec au moins une section */
  get hasParentForm(): boolean {
    return !!(this.config?.sections?.length);
  }

  /** Config des boutons d'action à projeter en footer de form-child
   *  quand le formulaire mère est absent */
  get childFooterConfig(): FormFooterConfig | undefined {
    if (this.hasParentForm) return undefined;
    return {
      extraButtons: this.config?.extraButtons,
      showReset: true,
      showSave:  true,
      isMobile:  this.isMobile,
    };
  }

  /** Reçoit les clics des boutons d'action projetés dans le footer form-child */
  onChildFooterAction(buttonId: string): void {
    if (buttonId === 'save')  { this.onSave();  return; }
    if (buttonId === 'reset') { this.onReset(); return; }
    const btn = this.config?.extraButtons?.find(b => b.id === buttonId);
    if (btn) this.onExtraButtonClick(btn);
  }

  getVisibleFields(fields: FormFieldConfig[]): FormFieldConfig[] {
    return fields.filter(f => f.visible !== false);
  }

  getColClass(field: FormFieldConfig): string {
    const span = field.colSpan ?? 4;
    return `col-12 col-sm-6 col-md-${span}`;
  }

  getExtraButtonClass(btn: ActionButtonConfig): string {
    const map: Record<string, string> = {
      primary: 'fb-action-btn--primary',
      danger:  'fb-action-btn--danger',
      success: 'fb-action-btn--success',
      default: 'fb-action-btn--default',
    };
    return `fb-action-btn ${map[btn.variant ?? 'default']} ${btn.cssClass ?? ''}`;
  }
}
