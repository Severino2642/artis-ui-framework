import { InjectionToken } from '@angular/core';
import type { TokenStorageKind } from '../api.config';

/** Abstraction de stockage des jetons. Les valeurs ne sont jamais journalisées. */
export interface TokenStorage {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export class MemoryTokenStorage implements TokenStorage {
  private readonly map = new Map<string, string>();
  get(key: string): string | null { return this.map.get(key) ?? null; }
  set(key: string, value: string): void { this.map.set(key, value); }
  remove(key: string): void { this.map.delete(key); }
}

export class WebTokenStorage implements TokenStorage {
  /** Repli mémoire si le stockage web est indisponible (mode privé, SSR…). */
  private readonly fallback = new MemoryTokenStorage();
  constructor(private readonly kind: 'localStorage' | 'sessionStorage') {}

  private get area(): Storage | null {
    try {
      return typeof window !== 'undefined' ? window[this.kind] : null;
    } catch {
      return null;
    }
  }
  get(key: string): string | null {
    try { return this.area ? this.area.getItem(key) : this.fallback.get(key); } catch { return this.fallback.get(key); }
  }
  set(key: string, value: string): void {
    try {
      if (this.area) this.area.setItem(key, value); else this.fallback.set(key, value);
    } catch { this.fallback.set(key, value); }
  }
  remove(key: string): void {
    try { this.area?.removeItem(key); } catch { /* ignore */ }
    this.fallback.remove(key);
  }
}

export function createTokenStorage(kind: TokenStorageKind): TokenStorage {
  return kind === 'memory' ? new MemoryTokenStorage() : new WebTokenStorage(kind);
}

/** Permet de fournir son propre stockage. */
export const ART_TOKEN_STORAGE = new InjectionToken<TokenStorage>('ART_TOKEN_STORAGE');
