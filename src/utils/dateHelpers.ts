/**
 * Date helper utilities for Turkish localization and month calculations
 */

export const getTurkishMonthName = (monthIndex: number): string => {
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  return months[monthIndex];
};

export const getMonthDateRange = (year: number, month: number) => {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start, end };
};

export const getPreviousMonth = () => {
  const now = new Date();
  const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  return { month: prevMonth, year: prevYear };
};

export const getCurrentMonth = () => {
  const now = new Date();
  return { month: now.getMonth(), year: now.getFullYear() };
};
