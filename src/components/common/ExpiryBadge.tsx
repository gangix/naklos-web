import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../../utils/format';

interface ExpiryBadgeProps {
  label: string;
  date: string | null;
  warningDays?: number;
}

/**
 * Displays expiry date with color-coded badge indicating time remaining
 * - Red: Expired or negative days
 * - Orange: 1-7 days remaining
 * - Yellow: 8-30 days remaining
 * - Green: More than 30 days remaining
 */
const ExpiryBadge = ({ label, date, warningDays = 30 }: ExpiryBadgeProps) => {
  const { t } = useTranslation();

  if (!date) {
    return (
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-sm text-gray-600 mb-1">{label}</p>
        <p className="text-sm text-gray-400">{t('simpleDocUpdate.notSpecified')}</p>
      </div>
    );
  }

  const today = new Date();
  const expiryDate = new Date(date);
  const diffTime = expiryDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Determine badge color and message
  let badgeColor = '';
  let badgeText = '';
  let badgeIcon: ReactNode = null;

  if (daysRemaining < 0) {
    // Expired
    badgeColor = 'bg-red-100 text-red-700 border border-red-200';
    badgeText = t('warning.expired');
    badgeIcon = <XCircle className="w-3.5 h-3.5" />;
  } else if (daysRemaining <= 7) {
    // Critical: 1-7 days
    badgeColor = 'bg-orange-100 text-orange-700 border border-orange-200';
    badgeText = `${daysRemaining} ${t('warning.daysRemaining')}`;
    badgeIcon = <AlertTriangle className="w-3.5 h-3.5" />;
  } else if (daysRemaining <= warningDays) {
    // Warning: 8-30 days
    badgeColor = 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    badgeText = `${daysRemaining} ${t('warning.daysRemaining')}`;
    badgeIcon = <Clock className="w-3.5 h-3.5" />;
  } else {
    // Valid: More than warning threshold
    badgeColor = 'bg-green-100 text-green-700 border border-green-200';
    badgeText = t('warning.valid');
    badgeIcon = <CheckCircle className="w-3.5 h-3.5" />;
  }

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <p className="text-sm text-gray-600 mb-2">{label}</p>
      <p className="text-sm font-medium text-gray-900 mb-2">{formatDate(date)}</p>
      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badgeColor}`}>
        {badgeIcon}
        <span>{badgeText}</span>
      </div>
    </div>
  );
};

export default ExpiryBadge;
