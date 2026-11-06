import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { ApiError, ApiService } from '@artis/api';
import { Subscription } from 'rxjs';
import { ART_UI_TEXTS } from '../../core/i18n/ui-texts';
import { ArtFileValue } from '../models/form-builder.model';
import { ArtFieldBase } from './field-renderer';

export type FileItemStatus = 'uploading' | 'done' | 'error';

export interface FileItem {
  key: number;
  value: ArtFileValue;
  file?: File;
  status: FileItemStatus;
  progress: number;
  error?: string;
  previewUrl?: string;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  const units = ['o', 'Ko', 'Mo', 'Go', 'To'];
  let i = 0, n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${i === 0 ? n : n.toFixed(n >= 10 ? 0 : 1)} ${units[i]}`;
}

/** Vrai si le fichier correspond à un des motifs : MIME exact, `image/*` ou extension `.pdf`. */
export function matchesAccept(file: { name: string; type: string }, accept: string[] | undefined): boolean {
  if (!accept?.length) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();
  return accept.some((raw) => {
    const a = raw.trim().toLowerCase();
    if (a.startsWith('.')) return name.endsWith(a);
    if (a.endsWith('/*')) return type.startsWith(a.slice(0, -1));
    return type === a;
  });
}

/**
 * Champ `file` : mono/multi-fichiers, glisser-déposer, validation (taille, type, nombre), aperçu image,
 * barre de progression d'envoi et gestion d'erreurs.
 *
 * Valeur : `ArtFileValue` (mono) ou `ArtFileValue[]` (multi) — `{ name, size, type, url?, id?, file? }`.
 * Avec `fileUploadUrl`, le fichier est envoyé via `ApiService.upload` (auth, tracing, loader gérés par @artis/api)
 * et la valeur n'est émise qu'après envoi réussi ; sans endpoint, la valeur contient le `File` natif.
 */
@Component({
  selector: 'art-file-field',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fl" [class.fl--drag]="drag()" [class.fl--invalid]="invalid()">
      @if (!readonly() && canAdd()) {
        <div class="fl__drop" role="button" tabindex="0" [id]="inputId()" [attr.aria-describedby]="describedBy()"
             [attr.aria-label]="texts.file.dropHere + ' — ' + texts.file.browse"
             (click)="browse()" (keydown.enter)="browse()" (keydown.space)="$event.preventDefault(); browse()"
             (dragover)="onDragOver($event)" (dragleave)="drag.set(false)" (drop)="onDrop($event)">
          <span class="material-symbols-outlined fl__drop-icon" aria-hidden="true">upload_file</span>
          <span class="fl__drop-text">{{ texts.file.dropHere }} <span class="fl__link">{{ texts.file.browse }}</span></span>
          @if (hint()) { <span class="fl__hint">{{ hint() }}</span> }
        </div>
        <input #native class="art-sr-only" type="file" tabindex="-1" aria-hidden="true" [multiple]="multiple()" [attr.accept]="acceptAttr()" (change)="onPick($event)" />
      }

      @if (errors().length) {
        <div class="fl__errors" role="alert">
          <ul class="fl__errors-list">
            @for (e of errors(); track $index) { <li>{{ e }}</li> }
          </ul>
        </div>
      }

      @if (items().length) {
        <ul class="fl__list" [attr.aria-label]="texts.file.selected(items().length)">
          @for (it of items(); track it.key) {
            <li class="fl__item" [class.fl__item--error]="it.status === 'error'">
              <span class="fl__thumb">
                @if (it.previewUrl) { <img [src]="it.previewUrl" alt="" /> } @else { <span class="material-symbols-outlined" aria-hidden="true">draft</span> }
              </span>
              <span class="fl__meta">
                <span class="fl__name">{{ it.value.name }}</span>
                <span class="fl__sub">{{ size(it.value.size) }}@if (it.value.type) { · {{ it.value.type }} }</span>
                @if (it.status === 'uploading') {
                  <span class="fl__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="it.progress" [attr.aria-label]="texts.file.progress(it.progress)">
                    <span class="fl__bar-fill" [style.width.%]="it.progress"></span>
                  </span>
                }
                @if (it.status === 'error') { <span class="fl__err">{{ it.error }}</span> }
              </span>
              @if (it.status === 'uploading') { <span class="fl__pct" aria-hidden="true">{{ it.progress }} %</span> }
              @if (it.status === 'done' && it.value.url) { <span class="material-symbols-outlined fl__ok" aria-hidden="true">check_circle</span> }
              @if (it.status === 'error' && it.file) {
                <button type="button" class="fl__btn" [attr.aria-label]="texts.file.retry + ' : ' + it.value.name" (click)="retry(it)"><span class="material-symbols-outlined" aria-hidden="true">refresh</span></button>
              }
              @if (!readonly()) {
                <button type="button" class="fl__btn" [attr.aria-label]="texts.file.remove + ' : ' + it.value.name" (click)="remove(it)"><span class="material-symbols-outlined" aria-hidden="true">close</span></button>
              }
            </li>
          }
        </ul>
      }
    </div>
  `,
  styleUrl: './file-field.component.css',
})
export class ArtFileFieldComponent extends ArtFieldBase {
  protected readonly texts = inject(ART_UI_TEXTS);
  private readonly api = inject(ApiService);

  protected readonly items = signal<FileItem[]>([]);
  protected readonly errors = signal<string[]>([]);
  protected readonly drag = signal(false);
  private readonly native = viewChild<ElementRef<HTMLInputElement>>('native');
  private readonly subs = new Map<number, Subscription>();
  private seq = 0;
  private lastEmitted: unknown = undefined;

  protected readonly multiple = computed(() => this.config().fileMultiple === true);
  protected readonly canAdd = computed(() => this.multiple() || this.items().length === 0);
  protected readonly acceptAttr = computed(() => this.config().fileAccept?.join(',') || null);
  protected readonly hint = computed(() => {
    const c = this.config();
    const parts: string[] = [];
    if (c.fileAccept?.length) parts.push(c.fileAccept.join(', '));
    if (c.fileMaxSize) parts.push('≤ ' + formatBytes(c.fileMaxSize));
    if (this.multiple() && c.fileMaxFiles) parts.push('max ' + c.fileMaxFiles);
    return parts.join(' · ');
  });

  constructor() {
    super();
    // Valeur externe → liste (sans boucle avec nos propres émissions).
    effect(() => {
      const v = this.value();
      if (v === this.lastEmitted) return;
      const list: ArtFileValue[] = Array.isArray(v) ? v : v ? [v as ArtFileValue] : [];
      this.items.set(list.map((fv) => ({ key: ++this.seq, value: fv, file: fv.file, status: 'done' as const, progress: 100, previewUrl: fv.url && fv.type?.startsWith('image/') ? fv.url : this.preview(fv.file) })));
    });
    inject(DestroyRef).onDestroy(() => {
      this.subs.forEach((s) => s.unsubscribe());
      this.items().forEach((i) => this.revoke(i));
    });
  }

  protected size = formatBytes;

  protected browse(): void { this.native()?.nativeElement.click(); }

  protected onPick(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.addFiles(Array.from(input.files ?? []));
    input.value = '';
  }

  protected onDragOver(e: DragEvent): void { e.preventDefault(); this.drag.set(true); }
  protected onDrop(e: DragEvent): void {
    e.preventDefault();
    this.drag.set(false);
    this.addFiles(Array.from(e.dataTransfer?.files ?? []));
  }

  /** Valide puis ajoute les fichiers ; déclenche l'envoi si un endpoint est configuré. */
  addFiles(files: File[]): void {
    if (this.readonly() || !files.length) return;
    const c = this.config();
    const errors: string[] = [];
    let candidates = files;

    if (!this.multiple()) candidates = files.slice(0, 1);
    const accepted: File[] = [];
    for (const f of candidates) {
      if (!matchesAccept(f, c.fileAccept)) { errors.push(this.texts.file.badType(f.name, c.fileAccept!.join(', '))); continue; }
      if (c.fileMaxSize && f.size > c.fileMaxSize) { errors.push(this.texts.file.tooLarge(f.name, formatBytes(c.fileMaxSize))); continue; }
      accepted.push(f);
    }
    if (this.multiple() && c.fileMaxFiles) {
      const room = Math.max(0, c.fileMaxFiles - this.items().length);
      if (accepted.length > room) { errors.push(this.texts.file.tooMany(c.fileMaxFiles)); accepted.length = room; }
    }
    this.errors.set(errors);
    if (!accepted.length) return;

    if (!this.multiple()) this.items().forEach((i) => this.drop(i)); // mono : remplace

    const created: FileItem[] = accepted.map((file) => ({
      key: ++this.seq,
      file,
      // Sans endpoint, la valeur transporte le `File` natif pour que le formulaire le téléverse lui-même.
      value: { name: file.name, size: file.size, type: file.type, ...(c.fileUploadUrl ? {} : { file }) },
      status: c.fileUploadUrl ? 'uploading' : 'done',
      progress: c.fileUploadUrl ? 0 : 100,
      previewUrl: this.preview(file),
    }));
    this.items.update((l) => (this.multiple() ? [...l, ...created] : created));
    created.forEach((it) => (c.fileUploadUrl ? this.upload(it) : undefined));
    this.emit();
  }

  protected retry(it: FileItem): void {
    this.patch(it.key, { status: 'uploading', progress: 0, error: undefined });
    this.upload({ ...it, status: 'uploading', progress: 0 });
  }

  protected remove(it: FileItem): void {
    this.drop(it);
    this.items.update((l) => l.filter((x) => x.key !== it.key));
    this.errors.set([]);
    this.emit();
  }

  private upload(it: FileItem): void {
    const c = this.config();
    if (!it.file || !c.fileUploadUrl) return;
    this.subs.get(it.key)?.unsubscribe();
    const sub = this.api
      .upload<unknown>(c.fileUploadUrl, it.file, { fieldName: c.fileFieldName, fields: c.fileUploadFields, skipErrorToast: true })
      .subscribe({
        next: (e) => {
          if (e.type === 'progress') this.patch(it.key, { progress: e.percent });
          else {
            const mapped = (c.fileMapResponse ?? defaultMapUpload)(e.body);
            const prev = this.items().find((x) => x.key === it.key);
            this.patch(it.key, {
              status: 'done', progress: 100, file: undefined,
              value: { ...(prev?.value ?? it.value), id: mapped.id, url: mapped.url, name: mapped.name ?? it.value.name },
            });
            this.emit();
          }
        },
        error: (err: unknown) => {
          const detail = err instanceof ApiError ? ` ${err.message}${err.status ? ` (HTTP ${err.status})` : ''}` : '';
          this.patch(it.key, { status: 'error', error: this.texts.file.uploadFailed(it.value.name) + detail });
          this.emit();
        },
      });
    this.subs.set(it.key, sub);
  }

  private patch(key: number, p: Partial<FileItem>): void {
    this.items.update((l) => l.map((x) => (x.key === key ? { ...x, ...p } : x)));
  }

  private drop(it: FileItem): void {
    this.subs.get(it.key)?.unsubscribe();
    this.subs.delete(it.key);
    this.revoke(it);
  }

  private preview(file?: File): string | undefined {
    return file && file.type.startsWith('image/') && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : undefined;
  }

  private revoke(it: FileItem): void {
    if (it.previewUrl?.startsWith('blob:') && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(it.previewUrl);
  }

  /** N'émet que les fichiers prêts (envoyés ou sans endpoint). */
  private emit(): void {
    const ready = this.items().filter((i) => i.status === 'done').map((i) => i.value);
    const out = this.multiple() ? ready : ready[0] ?? null;
    this.lastEmitted = out;
    this.valueChange.emit(out);
    this.blurred.emit();
  }
}

function defaultMapUpload(body: unknown): { id?: string | number; url?: string; name?: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const d = (typeof b['data'] === 'object' && b['data'] ? b['data'] : b) as Record<string, unknown>;
  return {
    id: (d['id'] ?? d['fileId']) as string | number | undefined,
    url: (d['url'] ?? d['location'] ?? d['href']) as string | undefined,
    name: d['name'] as string | undefined,
  };
}
