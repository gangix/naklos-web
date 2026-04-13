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
