import { useState } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { driverApi, truckApi } from '../../services/api';
import FileUpload from './FileUpload';
import type { Document, DocumentCategory } from '../../types';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: DocumentCategory;
  relatedType: 'driver' | 'truck';
  currentExpiryDate: string | null;
  onUploadSuccess?: () => void;
}

const DocumentUploadModal = ({
  isOpen,
  onClose,
  category,
  relatedType,
  currentExpiryDate,
  onUploadSuccess,
}: DocumentUploadModalProps) => {
  const { t } = useTranslation();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [suggestedExpiryDate, setSuggestedExpiryDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (document: Document) => {
    setSelectedDocument(document);
  };

  const handleSubmit = async () => {
    if (!selectedDocument || !suggestedExpiryDate) {
      toast.warning(t('toast.warning.selectDocAndDate'));
      return;
    }

    if (!selectedDocument.rawFile) {
      toast.error(t('toast.error.filePreparation'));
      return;
    }

    setIsSubmitting(true);

    try {
      if (relatedType === 'truck') {
        await truckApi.uploadMyTruckDocument(
          selectedDocument.rawFile,
          category,
          suggestedExpiryDate
        );
      } else {
        await driverApi.uploadMyDocument(
          selectedDocument.rawFile,
          category,
          suggestedExpiryDate
        );
      }

      toast.success(t('toast.success.documentUploaded'));
      onUploadSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Document upload failed:', error);
      toast.error(t('toast.error.documentUpload'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedDocument(null);
    setSuggestedExpiryDate('');
    setIsSubmitting(false);
    onClose();
  };

  const getCategoryLabel = (cat: DocumentCategory) => {
    const labels: Record<DocumentCategory, string> = {
      license: t('categoryLabel.license'),
      src: t('categoryLabel.src'),
      cpc: t('categoryLabel.cpc'),
      'compulsory-insurance': t('categoryLabel.compulsoryInsurance'),
      'comprehensive-insurance': t('categoryLabel.comprehensiveInsurance'),
      inspection: t('categoryLabel.inspection'),
    };
    return labels[cat];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            {getCategoryLabel(category)} {t('documentUpload.update')}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Current expiry date */}
          {currentExpiryDate && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 mb-1">{t('docUploadModal.currentExpiry')}</p>
              <p className="text-sm font-medium text-gray-900">{currentExpiryDate}</p>
            </div>
          )}

          {/* Document upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('docUploadModal.documentPhoto')}
            </label>
            {selectedDocument ? (
              <div className="relative">
                <img
                  src={selectedDocument.dataUrl}
                  alt="Selected document"
                  className="w-full rounded-lg border-2 border-primary-500"
                />
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
                >
                  <span className="text-xl">×</span>
                </button>
              </div>
            ) : (
              <FileUpload onFileSelect={handleFileSelect} />
            )}
          </div>

          {/* Expiry date input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('docUploadModal.newExpiryDate')}
            </label>
            <input
              type="date"
              value={suggestedExpiryDate}
              onChange={(e) => setSuggestedExpiryDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              {t('docUploadModal.expiryHint')}
            </p>
          </div>

          {/* Info note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              {t('docUploadModal.infoNote')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedDocument || !suggestedExpiryDate || isSubmitting}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? t('documentUpload.uploading') : t('documentUpload.submit')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadModal;
