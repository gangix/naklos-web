import { COMMON } from '../constants/text';

export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) {
    return `${COMMON.currency}0`;
  }
  return `${COMMON.currency}${amount.toLocaleString('tr-TR')}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
};

/**
 * "3 dk önce", "2 saat önce", "5 gün önce"
 */
export const formatRelativeTime = (dateString: string): string => {
  const then = new Date(dateString).getTime();
  const diffSec = Math.floor((Date.now() - then) / 1000);

  if (diffSec < 60) return 'az önce';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} dk önce`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} saat önce`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} gün önce`;
  return new Date(dateString).toLocaleDateString('tr-TR');
};
