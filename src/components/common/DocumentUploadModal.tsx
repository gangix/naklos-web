import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { DOCUMENT_UPLOAD, COMMON } from '../../constants/text';
import FileUpload from './FileUpload';
import type { Document, DocumentCategory } from '../../types';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: DocumentCategory;
  relatedType: 'driver' | 'truck';
  relatedId: string;
  relatedName: string;
  submittedByName: string;
  currentExpiryDate: string | null;
  previousImageUrl: string | null;
}

const DocumentUploadModal = ({
  isOpen,
  onClose,
  category,
  relatedType,
  relatedId,
  relatedName,
  submittedByName,
  currentExpiryDate,
  previousImageUrl,
}: DocumentUploadModalProps) => {
  const { submitDocument } = useData();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [suggestedExpiryDate, setSuggestedExpiryDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (document: Document) => {
    setSelectedDocument(document);
  };

  const handleSubmit = async () => {
    if (!selectedDocument || !suggestedExpiryDate) {
      alert('Lütfen belge ve geçerlilik tarihi seçin');
      return;
    }

    setIsSubmitting(true);

    try {
      submitDocument({
        category,
        relatedType,
        relatedId,
        relatedName,
        submittedBy: 'driver',
        submittedByName,
        imageDataUrl: selectedDocument.dataUrl,
        suggestedExpiryDate,
        confirmedExpiryDate: null,
        rejectionReason: null,
        rejectionNote: null,
        previousImageDataUrl: previousImageUrl,
        previousExpiryDate: currentExpiryDate,
      });

      alert('✓ Belge başarıyla gönderildi! Yöneticiniz inceleyecek.');
      handleClose();
    } catch (error) {
      alert('❌ Bir hata oluştu. Lütfen tekrar deneyin.');
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
      license: 'Ehliyet',
      src: 'SRC Belgesi',
      cpc: 'CPC Belgesi',
      'compulsory-insurance': 'Zorunlu Trafik Sigortası',
      'comprehensive-insurance': 'Kasko',
      inspection: 'Muayene',
    };
    return labels[cat];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">
            {getCategoryLabel(category)} {DOCUMENT_UPLOAD.update}
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
              <p className="text-xs text-gray-600 mb-1">Mevcut Geçerlilik Tarihi</p>
              <p className="text-sm font-medium text-gray-900">{currentExpiryDate}</p>
            </div>
          )}

          {/* Document upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Belge Fotoğrafı *
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
              Yeni Geçerlilik Tarihi *
            </label>
            <input
              type="date"
              value={suggestedExpiryDate}
              onChange={(e) => setSuggestedExpiryDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Belgede yazan geçerlilik tarihini girin. Yöneticiniz kontrol edecek.
            </p>
          </div>

          {/* Info note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              ℹ️ Belge yöneticiniz tarafından onaylandıktan sonra sistemde güncellenecek.
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
            {COMMON.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedDocument || !suggestedExpiryDate || isSubmitting}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? DOCUMENT_UPLOAD.uploading : DOCUMENT_UPLOAD.submit}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadModal;
