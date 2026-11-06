import { Injectable } from '@angular/core';
import {DetailField} from '../../models/detail-view.model';
import {formatDuration} from '../../../core/models/format-number.model';

@Injectable({ providedIn: 'root' })
export class ArtDetailViewUtilsService {

  /** Deeply get a value using dot notation: 'boutique.centre_commercial.nom' */
  deepGet(obj: any, path: string): any {
    if (!obj || !path) return null;
    return path.split('.').reduce((acc, key) => (acc != null ? acc[key] : null), obj);
  }

  /** Format a date value */
  formatDate(value: any, format = 'dd/MM/yyyy'): string {
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

  /** Get display string for a single field */
  getDisplayValue(data: any, field: DetailField): string {
    const raw = this.deepGet(data, field.attribute);
    if (raw == null) return field.formatDuration && field.formatDuration.fallback ? field.formatDuration.fallback : '';

    if (field.type === 'date') return this.formatDate(raw, field.dateFormat);

    if (field.type === 'number') {
      const n = Number(raw);
      if (field.formatDuration){
        field.formatDuration.value = n;
        return formatDuration(field.formatDuration);
      }
      if (isNaN(n)) return String(raw);
      const fixed = field.precision != null ? n.toFixed(field.precision) : n;
      return Number(fixed).toLocaleString('fr-FR');
    }

    return String(raw);
  }

  /** Get badge color for a value */
  getBadgeColor(value: any, field: DetailField): string {
    const map = field.badgeColorMap ?? {};
    const key = String(value ?? '').toLowerCase();
    return map[key] ?? map[String(value)] ?? field.badgeDefaultColor ?? 'var(--art-primary)';
  }

  /** Get array value for multibadge */
  getMultibadgeItems(data: any, field: DetailField): string[] {
    const arr = this.deepGet(data, field.attribute);
    if (!Array.isArray(arr)) return [];
    return arr.map(item => {
      if (typeof item === 'object' && field.displayKey) {
        return String(item[field.displayKey] ?? '');
      }
      return String(item ?? '');
    }).filter(Boolean);
  }

  /** Resolve link href — '@attribute' → dynamic value */
  resolveLink(data: any, field: DetailField): string {
    if (!field.linkHref) {
      // Default: use attribute value as URL
      return String(this.deepGet(data, field.attribute) ?? '#');
    }
    if (field.linkHref.startsWith('@')) {
      return String(this.deepGet(data, field.linkHref.slice(1)) ?? '#');
    }
    if (field.linkHref.includes(':')) {
      let resolvedLink = field.linkHref;
      const urlPart = field.linkHref.split('/');
      for (let i = 1; i < urlPart.length; i++) {
        if (!urlPart[i].startsWith(':')) continue;
        const part = urlPart[i].replace(':', '').trim();
        const val = this.deepGet(data, part);
        if (val === undefined) continue;
        resolvedLink = resolvedLink.replace(`:${part}`, String(val));
      }
      return resolvedLink;
    }
    return field.linkHref;
  }

}
