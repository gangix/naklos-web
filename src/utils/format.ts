import { COMMON } from '../constants/text';

export const formatCurrency = (amount: number): string => {
  return `${COMMON.currency}${amount.toLocaleString('tr-TR')}`;
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
};
