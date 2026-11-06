/**
 * Formate un nombre pour le rendre plus lisible.
 *
 * @param value     - Le nombre à formater
 * @param options   - Options de formatage
 * @returns         - Le nombre formaté en string
 *
 * Exemples :
 *   formatNumber(1234567)           → "1 234 567"
 *   formatNumber(1234567.89)        → "1 234 567,89"
 *   formatNumber(1500000, {compact}) → "1,5M"
 *   formatNumber(0.1234, {percent}) → "12,34 %"
 *   formatNumber(5000, {currency})  → "5 000 Ar"
 */

export interface FormatNumberOptions {
  /** Arrondir à N décimales (défaut: 0) */
  precision?: number;
  /** Affichage compact : 1 500 → 1,5K / 1 500 000 → 1,5M */
  compact?: boolean;
  /** Afficher comme pourcentage : 0.15 → 15 % */
  percent?: boolean;
  /** Ajouter une unité monétaire */
  currency?: string;        // ex: 'Ar', '€', '$'
  /** Séparateur de milliers (défaut: ' ') */
  thousandSep?: string;
  /** Séparateur décimal (défaut: ',') */
  decimalSep?: string;
  /** Afficher le signe + pour les positifs */
  showSign?: boolean;
  /** Valeur affichée si null/undefined/NaN (défaut: '—') */
  fallback?: string;
}

export function formatNombre(
  value: number | string | null | undefined,
  options: FormatNumberOptions = {}
): string {
  const {
    precision    = 0,
    compact      = false,
    percent      = false,
    currency,
    thousandSep  = '\u202F',   // espace fine insécable (standard FR)
    decimalSep   = ',',
    showSign     = false,
    fallback     = '—',
  } = options;

  // ── Valeur nulle ou invalide ──────────────────────────────────
  if (value === null || value === undefined || value === '') return fallback;
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return fallback;

  // ── Pourcentage ───────────────────────────────────────────────
  if (percent) {
    const pct = (num * 100).toFixed(precision).replace('.', decimalSep);
    return `${showSign && num > 0 ? '+' : ''}${pct}\u202F%`;
  }

  // ── Compact (K / M / Md) ──────────────────────────────────────
  if (compact) {
    const abs = Math.abs(num);
    const sign = showSign && num > 0 ? '+' : num < 0 ? '-' : '';
    const absNum = Math.abs(num);

    if (abs >= 1_000_000_000) {
      return `${sign}${(absNum / 1_000_000_000).toFixed(1).replace('.', decimalSep)}Md`;
    }
    if (abs >= 1_000_000) {
      return `${sign}${(absNum / 1_000_000).toFixed(1).replace('.', decimalSep)}M`;
    }
    if (abs >= 1_000) {
      return `${sign}${(absNum / 1_000).toFixed(1).replace('.', decimalSep)}K`;
    }
    return `${sign}${absNum.toFixed(precision).replace('.', decimalSep)}`;
  }

  // ── Formatage standard ────────────────────────────────────────
  const [intPart, decPart] = Math.abs(num).toFixed(precision).split('.');

  // Groupes de 3 chiffres
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);

  const sign = showSign && num > 0 ? '+' : num < 0 ? '-' : '';
  const decimal = decPart ? `${decimalSep}${decPart}` : '';
  const result = `${sign}${intFormatted}${decimal}`;

  // ── Devise ────────────────────────────────────────────────────
  if (currency) return `${result}\u202F${currency}`;

  return result;
}


/* ================================================================
   FORMAT DURATION — Convertit une durée brute en string lisible
================================================================ */

export type DurationUnit   = 'seconde' | 'minute' | 'heure' | 'jour' | 'semaine' | 'mois' | 'annee';
export type DurationFormat = 'hh:mm:ss' | 'hh:mm' | 'hh' | 'mm' | 'ss' | 'jour' | 'semaine' | 'mois' | 'annee' | 'auto';

export interface DurationConfig {
  value?:   number;
  unit:    DurationUnit;
  format?: DurationFormat;   // défaut: 'auto'
  /** Afficher l'unité textuelle (ex: "3 jours" au lieu de "3j") */
  verbose?: boolean;
  /** Valeur retournée si value est null/undefined/NaN */
  fallback?: string;
}

// ── Coefficients de conversion vers les secondes ──────────────
const TO_SECONDS: Record<DurationUnit, number> = {
  seconde: 1,
  minute:  60,
  heure:   3_600,
  jour:    86_400,
  semaine: 604_800,
  mois:    2_592_000,    // 30 jours
  annee:   31_536_000,   // 365 jours
};

// ─────────────────────────────────────────────────────────────
export function formatDuration(config: DurationConfig): string {
  const {
    value,
    unit,
    format   = 'auto',
    verbose  = false,
    fallback = '—',
  } = config;

  // ── Garde-fous ─────────────────────────────────────────────
  if (value === null || value === undefined || isNaN(value)) return fallback;

  // ── Tout convertir en secondes ─────────────────────────────
  const totalSeconds = Math.abs(value * TO_SECONDS[unit]);
  const sign         = value < 0 ? '-' : '';

  // ── Décomposition ──────────────────────────────────────────
  const secs   = Math.floor(totalSeconds);
  const mins   = Math.floor(secs   / 60);
  const hours  = Math.floor(mins   / 60);
  const days   = Math.floor(secs   / 86_400);
  const weeks  = Math.floor(days   / 7);
  const months = Math.floor(days   / 30);
  const years  = Math.floor(days   / 365);

  // ── Format automatique ─────────────────────────────────────
  const resolvedFormat = resolveAutoFormat(format, totalSeconds);

  // ── Rendu ──────────────────────────────────────────────────
  const pad = (n: number) => String(n).padStart(2, '0');

  switch (resolvedFormat) {

    case 'hh:mm:ss':
      return `${sign}${pad(hours)}:${pad(mins % 60)}:${pad(secs % 60)}`;

    case 'hh:mm':
      return `${sign}${pad(hours)}:${pad(mins % 60)}`;

    case 'hh':
      return verbose
        ? `${sign}${hours} heure${hours > 1 ? 's' : ''}`
        : `${sign}${hours}h`;

    case 'mm':
      return verbose
        ? `${sign}${mins} minute${mins > 1 ? 's' : ''}`
        : `${sign}${mins}min`;

    case 'ss':
      return verbose
        ? `${sign}${secs} seconde${secs > 1 ? 's' : ''}`
        : `${sign}${secs}s`;

    case 'jour':
      return verbose
        ? `${sign}${days} jour${days > 1 ? 's' : ''}`
        : `${sign}${days}j`;

    case 'semaine': {
      const remDays = days % 7;
      if (!verbose) return `${sign}${weeks}sem${remDays ? ` ${remDays}j` : ''}`;
      return remDays
        ? `${sign}${weeks} semaine${weeks > 1 ? 's' : ''} et ${remDays} jour${remDays > 1 ? 's' : ''}`
        : `${sign}${weeks} semaine${weeks > 1 ? 's' : ''}`;
    }

    case 'mois': {
      const remMonthDays = days % 30;
      if (!verbose) return `${sign}${months}mois${remMonthDays ? ` ${remMonthDays}j` : ''}`;
      return remMonthDays
        ? `${sign}${months} mois et ${remMonthDays} jour${remMonthDays > 1 ? 's' : ''}`
        : `${sign}${months} mois`;
    }

    case 'annee': {
      const remAnneeMonths = months % 12;
      if (!verbose) return `${sign}${years}an${remAnneeMonths ? ` ${remAnneeMonths}mois` : ''}`;
      return remAnneeMonths
        ? `${sign}${years} an${years > 1 ? 's' : ''} et ${remAnneeMonths} mois`
        : `${sign}${years} an${years > 1 ? 's' : ''}`;
    }

    default:
      return fallback;
  }
}

// ── Résolution du format automatique ──────────────────────────
function resolveAutoFormat(
  format: DurationFormat,
  totalSeconds: number
): DurationFormat {
  if (format !== 'auto') return format;

  const days = totalSeconds / 86_400;

  if (totalSeconds < 3_600)  return 'hh:mm';       // < 1h     → mm:ss serait logique mais hh:mm est plus lisible
  if (totalSeconds < 86_400) return 'hh:mm';       // < 24h    → hh:mm
  if (days        < 30)      return 'jour';         // < 30j    → X jours
  if (days        < 365)     return 'mois';         // < 12mois → X mois
  return 'annee';                                   // ≥ 1 an   → X ans
}
