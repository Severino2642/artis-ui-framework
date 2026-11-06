import { ArtLabelComponent } from '../../core/explanation/label.component';
import {
  Component, Input, Output, EventEmitter,
  OnInit, OnChanges, SimpleChanges,
  ChangeDetectorRef, HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterLink} from "@angular/router";
import {
  ButtonVariant,
  DetailButton,
  DetailButtonEvent,
  DetailCardConfig, DetailField
} from '../models/detail-view.model';
import {ArtDetailViewUtilsService} from '../services/detail-view-utils/detail-view-utils.service';

@Component({
  selector: 'art-detail-card',
  standalone: true,
  imports: [ArtLabelComponent, CommonModule, RouterLink],
  templateUrl: './detail-card.component.html',
  styleUrls: ['./detail-card.component.css'],
})
export class ArtDetailCardComponent implements OnInit, OnChanges {

  @Input() config!: DetailCardConfig;
  @Input() data: any = {};
  @Input() isMobile = false;

  @Output() buttonClick = new EventEmitter<DetailButtonEvent>();

  isCollapsed = false;
  /** Whether the "collapsed-actions" dropdown is open */
  isActionMenuOpen = false;
  /** Whether the mobile extra-buttons dropdown is open */
  isMobileMenuOpen = false;

  constructor(
    public utils: ArtDetailViewUtilsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.isCollapsed = this.config.collapsed ?? false;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config']) this.isCollapsed = this.config.collapsed ?? false;
  }

  // ─────────────────────────────────────────── Toggle ──────────
  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
    if (this.isCollapsed) {
      this.isActionMenuOpen = false;
      this.isMobileMenuOpen = false;
    }
    this.cdr.markForCheck();
  }

  toggleActionMenu(e: MouseEvent): void {
    e.stopPropagation();
    this.isActionMenuOpen = !this.isActionMenuOpen;
    this.cdr.markForCheck();
  }

  toggleMobileMenu(e: MouseEvent): void {
    e.stopPropagation();
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.cdr.markForCheck();
  }

  @HostListener('document:click')
  onDocClick(): void {
    if (this.isActionMenuOpen || this.isMobileMenuOpen) {
      this.isActionMenuOpen = false;
      this.isMobileMenuOpen = false;
      this.cdr.markForCheck();
    }
  }

  // ─────────────────────────────────────────── Buttons ─────────

  onButton(id: string, e: MouseEvent): void {
    e.stopPropagation();
    this.isActionMenuOpen = false;
    this.isMobileMenuOpen = false;
    this.buttonClick.emit({ buttonId: id, cardId: this.config.id, data: this.data });
  }

  /** Right-side buttons (default: edit + delete + right-position extra) */
  get rightButtons(): DetailButton[] {
    const btns: DetailButton[] = [];
    const extra = (this.config.extraButtons ?? []).filter(b => (b.position ?? 'right') === 'right');
    if (!this.isMobile) btns.push(...extra);
    if (this.config.showEditButton !== false)
      btns.push({ id: '__edit', label: 'Modifier', icon: 'edit', variant: 'default', position: 'right' });
    if (this.config.showDeleteButton !== false)
      btns.push({ id: '__delete', label: 'Supprimer', icon: 'delete_outline', variant: 'danger', position: 'right' });
    return btns;
  }

  /** Left-side buttons */
  get leftButtons(): DetailButton[] {
    return (this.config.extraButtons ?? []).filter(b => b.position === 'left');
  }

  /** Extra buttons for mobile dropdown */
  get mobileExtraButtons(): DetailButton[] {
    return (this.config.extraButtons ?? []);
  }

  /** All buttons for the collapsed action-menu (shown when card is collapsed) */
  get allButtons(): DetailButton[] {
    const btns: DetailButton[] = [...this.leftButtons];
    if (!this.isMobile) btns.push(...(this.config.extraButtons ?? []).filter(b => (b.position ?? 'right') === 'right'));
    if (this.config.showEditButton !== false)
      btns.push({ id: '__edit', label: 'Modifier', icon: 'edit', variant: 'default' });
    if (this.config.showDeleteButton !== false)
      btns.push({ id: '__delete', label: 'Supprimer', icon: 'delete_outline', variant: 'danger' });
    return btns;
  }

  get hasFooter(): boolean {
    const hasExtra = (this.config.extraButtons?.length ?? 0) > 0;
    const hasDefault = this.config.showEditButton !== false || this.config.showDeleteButton !== false;
    return hasExtra || hasDefault;
  }

  // ─────────────────────────────────────────── Helpers ─────────

  getBtnClass(variant?: ButtonVariant, extra?: string): string {
    const map: Record<string, string> = {
      primary: 'dc-btn--primary',
      default: 'dc-btn--default',
      danger:  'dc-btn--danger',
      success: 'dc-btn--success',
      warning: 'dc-btn--warning',
    };
    return `dc-btn ${map[variant ?? 'default']} ${extra ?? ''}`.trim();
  }

  getActionItemClass(variant?: string): string {
    const map: Record<string, string> = {
      danger:  'dc-action-item--danger',
      success: 'dc-action-item--success',
      warning: 'dc-action-item--warning',
    };
    return map[variant ?? ''] ?? '';
  }

  isImageField(f: DetailField):     boolean { return f.type === 'image'; }
  isBadgeField(f: DetailField):     boolean { return f.type === 'badge'; }
  isMultibadge(f: DetailField):     boolean { return f.type === 'multibadge'; }
  isLinkField(f: DetailField):      boolean { return f.type === 'link'; }
  isNumberOrText(f: DetailField):   boolean {
    return !f.type || ['text','number','date'].includes(f.type);
  }

  displayValue(field: DetailField): string {
    return this.utils.getDisplayValue(this.data, field);
  }

  badgeColor(field: DetailField): string {
    const raw = this.utils.deepGet(this.data, field.attribute);
    return this.utils.getBadgeColor(raw, field);
  }

  multibadgeItems(field: DetailField): string[] {
    return this.utils.getMultibadgeItems(this.data, field);
  }

  resolveLink(field: DetailField): string {
    return this.utils.resolveLink(this.data, field);
  }

  rawValue(field: DetailField): any {
    return this.utils.deepGet(this.data, field.attribute);
  }

  gridStyle(section: any): string {
    const cols = section.gridCols ?? section.columns.length;
    return typeof cols === 'string'
      ? `grid-template-columns: ${cols}`
      : `grid-template-columns: repeat(${cols}, 1fr)`;
  }

  protected readonly alert = alert;
}
