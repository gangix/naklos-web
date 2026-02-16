import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { APPROVALS, COMMON, REJECTION_REASONS } from '../../constants/text';
import type { DocumentSubmission } from '../../types';

interface DocumentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: DocumentSubmission;
}

const DocumentReviewModal = ({ isOpen, onClose, submission }: DocumentReviewModalProps) => {
  const { approveDocument, rejectDocument } = useData();
  const [confirmedDate, setConfirmedDate] = useState(submission.suggestedExpiryDate);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionNote, setRejectionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleApprove = async () => {
    if (!confirmedDate) {
      alert('Lütfen geçerlilik tarihi girin');
      return;
    }

    setIsSubmitting(true);
    try {
      approveDocument(submission.id, confirmedDate);
      alert('✓ Belge onaylandı');
      onClose();
    } catch (error) {
      alert('❌ Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      alert('Lütfen ret nedeni seçin');
      return;
    }

    if (rejectionReason === 'other' && !rejectionNote.trim()) {
      alert('Lütfen açıklama girin');
      return;
    }

    setIsSubmitting(true);
    try {
      rejectDocument(submission.id, rejectionReason, rejectionNote || null);
      alert('✓ Belge reddedildi');
      onClose();
    } catch (error) {
      alert('❌ Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      license: 'Ehliyet',
      src: 'SRC Belgesi',
      cpc: 'CPC Belgesi',
      'compulsory-insurance': 'Zorunlu Trafik Sigortası',
      'comprehensive-insurance': 'Kasko',
      inspection: 'Muayene',
    };
    return labels[category] || category;
  };

  const rejectionReasonOptions = [
    { value: 'blurry', label: REJECTION_REASONS.blurry },
    { value: 'wrong_type', label: REJECTION_REASONS.wrong_type },
    { value: 'expired', label: REJECTION_REASONS.expired },
    { value: 'mismatch', label: REJECTION_REASONS.mismatch },
    { value: 'incomplete', label: REJECTION_REASONS.incomplete },
    { value: 'other', label: REJECTION_REASONS.other },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {getCategoryLabel(submission.category)} - {APPROVALS.review}
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
                  <h3 className="text-sm font-bold text-gray-900 mb-2">{APPROVALS.previousDocument}</h3>
                  {submission.previousImageDataUrl ? (
                    <div className="space-y-2">
                      <img
                        src={submission.previousImageDataUrl}
                        alt="Previous document"
                        className="w-full rounded-lg border border-gray-300"
                      />
                      {submission.previousExpiryDate && (
                        <div className="bg-gray-50 rounded p-2">
                          <p className="text-xs text-gray-600">Mevcut Geçerlilik</p>
                          <p className="text-sm font-medium text-gray-900">{submission.previousExpiryDate}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                      <p className="text-sm text-gray-500">Önceki belge yok</p>
                    </div>
                  )}
                </div>

                {/* New Document */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">{APPROVALS.newDocument}</h3>
                  <div className="space-y-2">
                    <img
                      src={submission.imageDataUrl}
                      alt="New document"
                      className="w-full rounded-lg border-2 border-primary-500"
                    />
                    <div className="bg-blue-50 rounded p-2">
                      <p className="text-xs text-gray-600">{APPROVALS.suggestedDate}</p>
                      <p className="text-sm font-medium text-blue-900">{submission.suggestedExpiryDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expiry date confirmation */}
              <div className="bg-white rounded-lg border-2 border-primary-500 p-4 mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {APPROVALS.confirmDate} *
                </label>
                <input
                  type="date"
                  value={confirmedDate}
                  onChange={(e) => setConfirmedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Sürücünün önerdiği tarihi kontrol edin ve onaylayın veya düzeltin.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsRejecting(true)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border-2 border-red-500 text-red-600 rounded-lg font-medium hover:bg-red-50 disabled:opacity-50"
                >
                  {APPROVALS.reject}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={!confirmedDate || isSubmitting}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {APPROVALS.approve}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Rejection Form */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">{APPROVALS.selectReason}</h3>

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
                    {APPROVALS.rejectionNote} {rejectionReason === 'other' && '*'}
                  </label>
                  <textarea
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    placeholder="Sürücüye açıklama..."
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
                  {COMMON.cancel}
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason || (rejectionReason === 'other' && !rejectionNote.trim()) || isSubmitting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {APPROVALS.reject}
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
