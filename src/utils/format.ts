import i18n from '../i18n';

export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) {
    return `${i18n.t('common.currency')}0`;
  }
  return `${i18n.t('common.currency')}${amount.toLocaleString('tr-TR')}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(i18n.language, {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(date);
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat(i18n.language, {
    hour: '2-digit', minute: '2-digit',
  }).format(date);
};

/**
 * Formats a numeric value (from BigDecimal string or number) with the given
 * fractional-digit precision. Returns null for null/undefined/NaN so callers
 * can decide the fallback glyph (— is conventional in this codebase).
 */
export const formatDecimal = (
  v: string | number | null | undefined,
  digits = 1,
): string | null => {
  if (v === null || v === undefined) return null;
  const n = typeof v === 'number' ? v : Number(v);
  if (Number.isNaN(n)) return null;
  return n.toLocaleString(i18n.language, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

/** Compact currency for space-constrained slots (monthly trend strip,
 *  badges). ₺8450 → "₺8,5k", ₺820 → "₺820". Locale-aware via toLocaleString. */
export const formatCompactCurrency = (v: number): string => {
  const sign = i18n.t('common.currency');
  if (v >= 1000) {
    const k = (v / 1000).toLocaleString(i18n.language, { maximumFractionDigits: 1 });
    return `${sign}${k}k`;
  }
  return `${sign}${Math.round(v).toLocaleString(i18n.language)}`;
};

/**
 * "3 dk önce", "2 saat önce", "5 gün önce"
 */
export const formatRelativeTime = (dateString: string): string => {
  const then = new Date(dateString).getTime();
  const diffSec = Math.floor((Date.now() - then) / 1000);

  if (diffSec < 60) return i18n.t('format.justNow');
  if (diffSec < 3600) return i18n.t('format.minutesAgo', { count: Math.floor(diffSec / 60) });
  if (diffSec < 86400) return i18n.t('format.hoursAgo', { count: Math.floor(diffSec / 3600) });
  if (diffSec < 604800) return i18n.t('format.daysAgo', { count: Math.floor(diffSec / 86400) });
  return new Intl.DateTimeFormat(i18n.language).format(new Date(dateString));
};
