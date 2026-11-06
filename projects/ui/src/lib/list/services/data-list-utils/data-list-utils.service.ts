import { FormFieldConfig } from '../../../form/models/form-builder.model';
import { escapeHtml } from '@artis/api';
import { Injectable } from '@angular/core';
import {
  ColumnDef,
  ColumnField,
  ComputedStat,
  SortState,
  StatCardConfig
} from '../../models/data-list.model';
import {formatDuration} from '../../../core/models/format-number.model';

@Injectable({ providedIn: 'root' })
export class ArtDataListUtilsService {

  // ─────────────────────────────────────────── Deep get ────────
  /** Get a deeply nested value using dot notation: 'boutique.centre_commercial.nom' */
  deepGet(obj: any, path: string): any {
    if (!obj || !path) return null;
    return path.split('.').reduce((acc, k) => (acc != null ? acc[k] : null), obj);
  }

  // ─────────────────────────────────────────── Sort ────────────
  /**
   * Tri multi-clés, non destructif. Règles :
   * - les valeurs vides (`null`/`undefined`/`''`) vont **toujours en dernier**, quel que soit le sens ;
   * - texte : `localeCompare` « naturel » (item 2 < item 10), insensible à la casse/accents ;
   * - nombres, dates (`Date`) et booléens comparés par valeur numérique.
   */
  sortData(data: any[], sorts: SortState[]): any[] {
    if (!sorts.length) return data;
    const empty = (v: unknown) => v === null || v === undefined || v === '';
    const cmp = (a: any, b: any): number => {
      if (typeof a === 'string' || typeof b === 'string') return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
      const x = a instanceof Date ? a.getTime() : Number(a);
      const y = b instanceof Date ? b.getTime() : Number(b);
      return x - y;
    };
    return [...data].sort((a, b) => {
      for (const s of sorts) {
        const va = this.deepGet(a, s.key);
        const vb = this.deepGet(b, s.key);
        if (empty(va) && empty(vb)) continue;
        if (empty(va)) return 1;
        if (empty(vb)) return -1;
        const c = cmp(va, vb);
        if (c !== 0) return s.direction === 'asc' ? c : -c;
      }
      return 0;
    });
  }

  // ─────────────────────────────────────────── Stats ───────────
  computeStat(stat: StatCardConfig, data: any[]): string | number {
    if (stat.customCalc) {
      let result_custom = stat.customCalc(data);
      if (typeof result_custom === 'number' && stat.formatDuration) {
        stat.formatDuration.value = result_custom;
        return formatDuration(stat.formatDuration);
      }
      return result_custom;
    }
    if (!stat.attribute || !stat.calcMethod) return data.length;

    const values = data
      .map(row => this.deepGet(row, stat.attribute!))
      .filter(v => v != null && !isNaN(Number(v)))
      .map(Number);

    let result: number;
    switch (stat.calcMethod) {
      case 'count':  result = data.length; break;
      case 'sum':    result = values.reduce((a, b) => a + b, 0); break;
      case 'avg':    result = values.length ? values.reduce((a,b)=>a+b,0)/values.length : 0; break;
      case 'min':    result = Math.min(...values); break;
      case 'max':    result = Math.max(...values); break;
      default:       result = data.length;
    }

    if (stat.formatDuration) {
      stat.formatDuration.value = result;
      return formatDuration(stat.formatDuration);
    }

    const precision = stat.precision ?? 0;
    return precision > 0 ? result.toFixed(precision) : Math.round(result);
  }

  computeAllStats(stats: StatCardConfig[], data: any[], totalCount?: number): ComputedStat[] {
    return stats
      .filter(s => s.visible !== false)
      .map(s => ({
        ...s,
        computedValue: this.computeStat(s, data),
      }));
  }

  // ─────────────────────────────────────────── Date format ─────
  formatDate(value: any, format: string = 'dd/MM/yyyy'): string {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    const pad = (n: number) => String(n).padStart(2, '0');
    return format
      .replace('yyyy', String(d.getFullYear()))
      .replace('MM',   pad(d.getMonth() + 1))
      .replace('dd',   pad(d.getDate()))
      .replace('HH',   pad(d.getHours()))
      .replace('mm',   pad(d.getMinutes()))
      .replace('ss',   pad(d.getSeconds()));
  }

  // ─────────────────────────────────────────── Cell value ──────
  getCellDisplayValue(row: any, field: ColumnField): string {
    const raw = this.deepGet(row, field.attribute);
    if (raw == null) return field.formatDuration && field.formatDuration.fallback ? field.formatDuration.fallback : '';

    if (field.type === 'date') return this.formatDate(raw, field.dateFormat);
    if (field.type === 'number') {
      const n = Number(raw);
      if (field.formatDuration) {
        field.formatDuration.value = n;
        return formatDuration(field.formatDuration);
      }
      return isNaN(n) ? String(raw) : n.toLocaleString('fr-FR');
    }
    if (field.maxLength && field.maxLength>0){
      return this.truncate(String(raw), field.maxLength);
    }
    return String(raw);
  }

  getBadgeColor(value: any, field: ColumnField): string {
    const map = field.badgeColorMap ?? {};
    const key = String(value ?? '').toLowerCase();
    return map[key] ?? map[String(value)] ?? field.badgeDefaultColor ?? 'var(--art-primary)';
  }

  // ─────────────────────────────────────────── Export ──────────

  /** Flatten a row to a plain Record using visible columns */
  flattenRow(row: any, columns: ColumnDef[]): Record<string, string> {
    const result: Record<string, string> = {};
    for (const col of columns) {
      const parts: string[] = [];
      for (const sec of col.sections) {
        for (const f of sec.fields) {
          parts.push(this.getCellDisplayValue(row, f));
        }
      }
      result[col.title] = parts.filter(Boolean).join(' ');
    }
    return result;
  }

  exportCSV(data: any[], columns: ColumnDef[], filename = 'export.csv'): void {
    const rows = data.map(r => this.flattenRow(r, columns));
    const headers = columns.map(c => c.title);
    const lines = [
      headers.join(';'),
      ...rows.map(r => headers.map(h => `"${this.safeCell(r[h] ?? '').replace(/"/g, '""')}"`).join(';')),
    ];
    this.downloadBlob(lines.join('\n'), 'text/csv;charset=utf-8;', filename);
  }

  exportExcel(data: any[], columns: ColumnDef[], filename = 'export.xls'): void {
    const rows = data.map(r => this.flattenRow(r, columns));
    const headers = columns.map(c => c.title);
    const trs = [
      `<tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr>`,
      ...rows.map(r => `<tr>${headers.map(h => `<td>${escapeHtml(this.safeCell(r[h] ?? ''))}</td>`).join('')}</tr>`),
    ];
    const html = `<table>${trs.join('')}</table>`;
    const blob = new Blob(
      [`<html><head><meta charset="utf-8"></head><body>${html}</body></html>`],
      { type: 'application/vnd.ms-excel' }
    );
    this.triggerDownload(URL.createObjectURL(blob), filename);
  }

  exportXML(data: any[], columns: ColumnDef[], filename = 'export.xml'): void {
    const rows = data.map(r => this.flattenRow(r, columns));
    const items = rows.map(r => {
      const fields = Object.entries(r)
        .map(([k, v]) => `  <${this.xmlTag(k)}>${this.escapeXml(v)}</${this.xmlTag(k)}>`)
        .join('\n');
      return `<item>\n${fields}\n</item>`;
    }).join('\n');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<data>\n${items}\n</data>`;
    this.downloadBlob(xml, 'application/xml', filename);
  }

  exportJSON(data: any[], columns: ColumnDef[], filename = 'export.json'): void {
    const rows = data.map(r => this.flattenRow(r, columns));
    this.downloadBlob(JSON.stringify(rows, null, 2), 'application/json', filename);
  }

  exportPDF(data: any[], columns: ColumnDef[], title: string, filename = 'export.pdf'): void {
    const rows = data.map(r => this.flattenRow(r, columns));
    const headers = columns.map(c => c.title);
    const trs = rows.map(r =>
      `<tr>${headers.map(h => `<td>${escapeHtml(r[h] ?? '')}</td>`).join('')}</tr>`
    ).join('');
    // La fenêtre d'impression est un document séparé : on y recopie les valeurs RÉSOLUES des tokens du thème actif.
    const css = getComputedStyle(document.documentElement);
    const t = (name: string) => css.getPropertyValue(name).trim();
    const html = `<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <title>${escapeHtml(title)}</title>
      <style>
        body { font-family: ${t('--art-font-sans')}; font-size: ${t('--art-text-xs')}; color: ${t('--art-text')}; }
        h1 { font-size: ${t('--art-text-lg')}; margin-bottom: ${t('--art-space-3')}; color: ${t('--art-text')}; }
        table { width: 100%; border-collapse: collapse; }
        th { background: ${t('--art-inverse-surface')}; color: ${t('--art-text-inverse')}; padding: ${t('--art-space-2')} ${t('--art-space-3')}; text-align: left; font-size: ${t('--art-text-2xs')}; }
        td { padding: ${t('--art-space-1-5')} ${t('--art-space-3')}; border-bottom: 1px solid ${t('--art-border')}; }
        tr:nth-child(even) td { background: ${t('--art-bg')}; }
        @media print { body { -webkit-print-color-adjust: exact; } }
      </style>
    </head><body>
      <h1>${escapeHtml(title)}</h1>
      <table>
        <thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
        <tbody>${trs}</tbody>
      </table>
    </body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.onload = () => { win.print(); };
    }
  }

  // ─────────────────────────────────────────── Helpers ─────────
  private downloadBlob(content: string, mimeType: string, filename: string): void {
    const blob = new Blob(['\uFEFF' + content], { type: mimeType });
    this.triggerDownload(URL.createObjectURL(blob), filename);
  }

  private triggerDownload(url: string, filename: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  private xmlTag(s: string): string {
    return s.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^(\d)/, '_$1');
  }

  // ─────────────────────────────────────────── Filtrage local ──

  /** Minuscules sans accents : « Écran » et « ecran » se correspondent. */
  normalizeText(v: unknown): string {
    return String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  }

  /** Vrai si un filtre porte une valeur exploitable (non vide, intervalle avec au moins une borne, tableau non vide). */
  hasFilterValue(v: unknown): boolean {
    if (v === null || v === undefined || v === '') return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object') return Object.values(v as object).some((x) => x !== null && x !== undefined && x !== '');
    return true;
  }

  /** Champs de filtre déduits des colonnes (texte, intervalle pour nombre/date, liste pour badge) — une colonne = un champ. */
  autoFilterFields(columns: ColumnDef[], data: any[] = []): FormFieldConfig[] {
    return columns.map((col) => this.columnFilterField(col, data));
  }

  /** Champ de filtre d'UNE colonne : `col.filterable` (objet) personnalise, sinon déduit du type du premier champ. */
  columnFilterField(col: ColumnDef, data: any[] = []): FormFieldConfig {
    const first = col.sections[0]?.fields[0];
    const custom = typeof col.filterable === 'object' && col.filterable ? col.filterable : {};
    let type: FormFieldConfig['type'] = 'text';
    let extra: Partial<FormFieldConfig> = {};
    if (first?.type === 'number') { type = 'interval'; extra = { intervalBaseType: 'number' }; }
    else if (first?.type === 'date') { type = 'interval'; extra = { intervalBaseType: 'date' }; }
    else if (first?.type === 'badge') {
      type = 'select';
      const keys = first.badgeColorMap ? Object.keys(first.badgeColorMap) : [...new Set(data.map((r) => this.deepGet(r, first.attribute)).filter((v) => v != null && v !== ''))].map(String);
      extra = { options: keys.map((k) => ({ value: k, label: k })), optionValueKey: 'value', optionLabelKey: 'label' };
    }
    return { name: first?.attribute ?? col.key, label: col.title, type, colSpan: 6, ...extra, ...custom } as FormFieldConfig;
  }

  /** Applique tous les filtres actifs (ET logique). `fields` donne le type de chaque filtre ; `customFn` remplace la comparaison. */
  filterData(data: any[], filters: Record<string, any>, fields: FormFieldConfig[] = [], customFn?: (row: any, filters: Record<string, any>) => boolean): any[] {
    const active = Object.entries(filters ?? {}).filter(([, v]) => this.hasFilterValue(v));
    if (!active.length) return data;
    if (customFn) return data.filter((row) => customFn(row, Object.fromEntries(active)));
    const byName = new Map(fields.map((f) => [f.name, f]));
    return data.filter((row) =>
      active.every(([name, value]) => {
        const f = byName.get(name);
        return this.matchesFilter(this.deepGet(row, f?.filterAttribute ?? name), value, f);
      }),
    );
  }

  /** Compare UNE cellule à UNE valeur de filtre selon le type du champ. Une cellule tableau correspond si un de ses éléments correspond. */
  matchesFilter(cell: any, value: any, field?: FormFieldConfig): boolean {
    if (Array.isArray(cell)) return cell.some((c) => this.matchesFilter(c, value, field));
    const type = field?.type;
    const isRange = type === 'interval' || (value && typeof value === 'object' && !Array.isArray(value) && ('min' in value || 'max' in value));
    if (isRange) {
      const { min, max } = value as { min?: unknown; max?: unknown };
      if (cell === null || cell === undefined || cell === '') return false;
      const asDate = field?.intervalBaseType === 'date' || field?.intervalBaseType === 'datetime' || type === 'date' || this.looksLikeDate(min) || this.looksLikeDate(max);
      if (asDate) {
        const t = this.toTime(cell);
        if (Number.isNaN(t)) return false;
        if (this.hasFilterValue(min) && t < this.toTime(min)) return false;
        if (this.hasFilterValue(max) && t > this.toTime(max) + (this.isDateOnly(max) ? 86_399_999 : 0)) return false;
        return true;
      }
      const n = Number(cell);
      if (Number.isNaN(n)) return false;
      if (this.hasFilterValue(min) && n < Number(min)) return false;
      if (this.hasFilterValue(max) && n > Number(max)) return false;
      return true;
    }
    if (Array.isArray(value)) return value.some((v) => this.sameValue(cell, v));
    if (type === 'select' || type === 'autocomplete' || type === 'multiselect') return this.sameValue(cell, value);
    if (type === 'date' || type === 'datetime') {
      const a = new Date(this.toTime(cell)), b = new Date(this.toTime(value));
      return !Number.isNaN(a.getTime()) && a.toDateString() === b.toDateString();
    }
    if (type === 'number') return Number(cell) === Number(value);
    if (typeof value === 'boolean') return cell === value || String(cell) === String(value);
    const c = this.normalizeText(cell), v = this.normalizeText(value);
    const mode = field?.filterMatch ?? 'contains';
    return mode === 'equals' ? c === v : mode === 'startsWith' ? c.startsWith(v) : c.includes(v);
  }

  private sameValue(a: unknown, b: unknown): boolean {
    return a !== null && a !== undefined && String(a) === String(b);
  }
  private isDateOnly(v: unknown): boolean { return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v); }
  private looksLikeDate(v: unknown): boolean { return v instanceof Date || (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)); }
  /** `yyyy-MM-dd` est lu en heure LOCALE (et non UTC) pour que « le 5 mars » soit bien le 5 mars chez l'utilisateur. */
  private toTime(v: unknown): number {
    if (v instanceof Date) return v.getTime();
    if (typeof v === 'number') return v;
    const s = String(v ?? '');
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    return m ? new Date(+m[1], +m[2] - 1, +m[3]).getTime() : new Date(s).getTime();
  }

  /**
   * Neutralise l'injection de formule (CSV/Excel) : une cellule texte commençant par = + - @ (ou tabulation/retour chariot)
   * serait interprétée comme une formule par le tableur. On la préfixe d'une apostrophe. Les nombres (`-5`, `1,5`) sont conservés.
   */
  safeCell(value: string): string {
    return /^[=+\-@\t\r]/.test(value) && !/^[-+]?\d+([.,]\d+)?$/.test(value) ? `'${value}` : value;
  }

  private escapeXml(s: string): string {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  private truncate(text: string | null | undefined, maxLength: number): string {
    if (!text) {
      return '';
    }

    if (text.length <= maxLength) {
      return text;
    }

    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    return (lastSpace > 0
      ? truncated.substring(0, lastSpace)
      : truncated) + '...';
  }

}
