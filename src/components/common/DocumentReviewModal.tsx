import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useData } from '../../contexts/DataContext';
import type { DocumentSubmission } from '../../types';

interface DocumentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: DocumentSubmission;
}

const DocumentReviewModal = ({ isOpen, onClose, submission }: DocumentReviewModalProps) => {
  const { t } = useTranslation();
  const { approveDocument, rejectDocument } = useData();
  const [confirmedDate, setConfirmedDate] = useState(submission.suggestedExpiryDate);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionNote, setRejectionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleApprove = async () => {
    if (!confirmedDate) {
      toast.warning(t('toast.warning.enterExpiryDate'));
      return;
    }

    setIsSubmitting(true);
    try {
      approveDocument(submission.id, confirmedDate);
      toast.success(t('toast.success.documentApproved'));
      onClose();
    } catch (error) {
      toast.error(t('toast.error.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      toast.warning(t('toast.warning.selectRejectionReason'));
      return;
    }

    if (rejectionReason === 'other' && !rejectionNote.trim()) {
      toast.warning(t('toast.warning.enterDescription'));
      return;
    }

    setIsSubmitting(true);
    try {
      rejectDocument(submission.id, rejectionReason, rejectionNote || null);
      toast.success(t('toast.success.documentRejected'));
      onClose();
    } catch (error) {
      toast.error(t('toast.error.generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      license: t('categoryLabel.license'),
      src: t('categoryLabel.src'),
      cpc: t('categoryLabel.cpc'),
      'compulsory-insurance': t('categoryLabel.compulsoryInsurance'),
      'comprehensive-insurance': t('categoryLabel.comprehensiveInsurance'),
      inspection: t('categoryLabel.inspection'),
    };
    return labels[category] || category;
  };

  const rejectionReasonOptions = [
    { value: 'blurry', label: t('rejectionReason.blurry') },
    { value: 'wrong_type', label: t('rejectionReason.wrong_type') },
    { value: 'expired', label: t('rejectionReason.expired') },
    { value: 'mismatch', label: t('rejectionReason.mismatch') },
    { value: 'incomplete', label: t('rejectionReason.incomplete') },
    { value: 'other', label: t('rejectionReason.other') },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {getCategoryLabel(submission.category)} - {t('approval.review')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {submission.submittedByName} - {submission.relatedName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {!isRejecting ? (
            <>
              {/* Side-by-side document comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Previous Document */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">{t('approval.previousDocument')}</h3>
                  {submission.previousImageDataUrl ? (
                    <div className="space-y-2">
                      <img
                        src={submission.previousImageDataUrl}
                        alt="Previous document"
                        className="w-full rounded-lg border border-gray-300"
                      />
                      {submission.previousExpiryDate && (
                        <div className="bg-gray-50 rounded p-2">
                          <p className="text-xs text-gray-600">{t('docReview.currentExpiry')}</p>
                          <p className="text-sm font-medium text-gray-900">{submission.previousExpiryDate}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                      <p className="text-sm text-gray-500">{t('docReview.noPreviousDoc')}</p>
                    </div>
                  )}
                </div>

                {/* New Document */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">{t('approval.newDocument')}</h3>
                  <div className="space-y-2">
                    <img
                      src={submission.imageDataUrl}
                      alt="New document"
                      className="w-full rounded-lg border-2 border-primary-500"
                    />
                    <div className="bg-blue-50 rounded p-2">
                      <p className="text-xs text-gray-600">{t('approval.suggestedDate')}</p>
                      <p className="text-sm font-medium text-blue-900">{submission.suggestedExpiryDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expiry date confirmation */}
              <div className="bg-white rounded-lg border-2 border-primary-500 p-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('approval.confirmDate')} *
                </label>
                <input
                  type="date"
                  value={confirmedDate}
                  onChange={(e) => setConfirmedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('docReview.expiryConfirmHint')}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsRejecting(true)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border-2 border-red-500 text-red-600 rounded-lg font-medium hover:bg-red-50 disabled:opacity-50"
                >
                  {t('approval.reject')}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={!confirmedDate || isSubmitting}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('approval.approve')}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Rejection Form */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">{t('approval.selectReason')}</h3>

                <div className="space-y-2 mb-4">
                  {rejectionReasonOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                        rejectionReason === option.value
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="rejectionReason"
                        value={option.value}
                        checked={rejectionReason === option.value}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="mr-3"
                      />
                      <span className="text-sm font-medium text-gray-900">{option.label}</span>
                    </label>
                  ))}
                </div>

                {/* Optional note (required for "other") */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('approval.rejectionNote')} {rejectionReason === 'other' && '*'}
                  </label>
                  <textarea
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    placeholder={t('docReview.driverExplanation')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>

              {/* Rejection Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsRejecting(false);
                    setRejectionReason('');
                    setRejectionNote('');
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason || (rejectionReason === 'other' && !rejectionNote.trim()) || isSubmitting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('approval.reject')}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentReviewModal;
