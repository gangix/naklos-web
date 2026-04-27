import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { FileText, Upload } from 'lucide-react';
import { truckApi, driverApi } from '../../services/api';
import { FileInput, TextInput } from './FormField';
import ConfirmActionModal from '../fuel/ConfirmActionModal';
import type { DocumentCategory } from '../../types';

interface TruckDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  expiryDate: string | null;
  uploadedAt: string;
}

interface SimpleDocumentUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: DocumentCategory;
  relatedType: 'driver' | 'truck';
  relatedId: string;
  relatedName: string;
  currentExpiryDate: string | null;
  onUpdate: (category: DocumentCategory, expiryDate: string) => Promise<void>;
}

const SimpleDocumentUpdateModal = ({
  isOpen,
  onClose,
  category,
  relatedType,
  relatedId,
  relatedName,
  currentExpiryDate: _currentExpiryDate,
  onUpdate,
}: SimpleDocumentUpdateModalProps) => {
  const { t } = useTranslation();
  const [expiryDate, setExpiryDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentDoc, setCurrentDoc] = useState<TruckDocument | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCurrentDoc();
    }
  }, [isOpen, relatedId, category]);

  // Pre-populate expiry input from current doc when it loads.
  useEffect(() => {
    setExpiryDate(currentDoc?.expiryDate ?? '');
  }, [currentDoc]);

  const loadCurrentDoc = async () => {
    setLoadingDoc(true);
    try {
      const allDocs = (relatedType === 'driver'
        ? await driverApi.getDocuments(relatedId)
        : await truckApi.getDocuments(relatedId)) as TruckDocument[];
      // The "current" doc for a category = most recently uploaded one of that type.
      const latest = allDocs
        .filter((doc) => doc.documentType === category)
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0] ?? null;
      setCurrentDoc(latest);
    } catch (err) {
      console.error('Error loading documents:', err);
      setCurrentDoc(null);
    } finally {
      setLoadingDoc(false);
    }
  };

  if (!isOpen) return null;

  const getCategoryLabel = (cat: DocumentCategory) => {
    const labels: Record<DocumentCategory, string> = {
      license: t('categoryLabel.license'),
      src: t('categoryLabel.src'),
      cpc: t('categoryLabel.cpc'),
      'compulsory-insurance': t('categoryLabel.compulsoryInsurance'),
      'comprehensive-insurance': t('categoryLabel.comprehensiveInsurance'),
      inspection: t('categoryLabel.inspection'),
      tachograph: t('categoryLabel.tachograph'),
      'k-certificate': t('categoryLabel.kCertificate'),
      'adr-vehicle': t('categoryLabel.adrVehicle'),
      'adr-driver': t('categoryLabel.adrDriver'),
      psychotechnical: t('categoryLabel.psychotechnical'),
    };
    return labels[cat];
  };

  const handleFileSelected = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    setError(null);
  };

  const handleSave = async () => {
    if (!expiryDate) {
      setError(t('simpleDocUpdate.expiryDateError'));
      return;
    }

    // Two save paths:
    //  1. New file picked (replace or first upload)  -> upload (multipart) with expiry
    //  2. No new file but expiry changed             -> updateDocumentExpiry on current doc
    // If neither, we early-return.
    const expiryChanged = expiryDate !== (currentDoc?.expiryDate ?? '');
    if (!selectedFile && !expiryChanged) {
      onClose();
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (selectedFile) {
        if (relatedType === 'driver') {
          await driverApi.uploadDocument(relatedId, selectedFile, category, expiryDate);
        } else {
          await truckApi.uploadDocument(relatedId, selectedFile, category, expiryDate);
        }
        toast.success(t('toast.success.documentUploaded'));
      } else if (currentDoc) {
        if (relatedType === 'driver') {
          await driverApi.updateDocumentExpiry(currentDoc.id, expiryDate);
        } else {
          await truckApi.updateDocumentExpiry(currentDoc.id, expiryDate);
        }
        toast.success(t('toast.success.expiryUpdated'));
      }

      setSelectedFile(null);
      await loadCurrentDoc();
      // Tell the parent so its expiry-date columns refresh.
      await onUpdate(category, expiryDate);
    } catch (err) {
      console.error('Error saving document:', err);
      setError(err instanceof Error ? err.message : t('toast.error.documentUpload'));
    } finally {
      setIsSaving(false);
    }
  };

  const runDeleteCurrent = async () => {
    if (!currentDoc) return;
    try {
      if (relatedType === 'driver') {
        await driverApi.deleteDocument(currentDoc.id);
      } else {
        await truckApi.deleteDocument(currentDoc.id);
      }
      toast.success(t('toast.success.documentDeleted'));
      setPendingDelete(false);
      setCurrentDoc(null);
      setSelectedFile(null);
      setExpiryDate('');
      await onUpdate(category, '');
    } catch (err) {
      console.error('Error deleting document:', err);
      toast.error(t('toast.error.documentDelete'));
    }
  };

  const handleClose = () => {
    setExpiryDate('');
    setSelectedFile(null);
    setError(null);
    setIsSaving(false);
    setCurrentDoc(null);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const downloadCurrent = () => {
    if (!currentDoc) return;
    if (relatedType === 'driver') {
      driverApi.downloadDocument(currentDoc.id);
    } else {
      truckApi.downloadDocument(currentDoc.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-900">
            {getCategoryLabel(category)} {t('simpleDocUpdate.management')}
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
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">
              {relatedType === 'truck' ? t('simpleDocUpdate.vehicle') : t('simpleDocUpdate.driver')}
            </p>
            <p className="text-sm font-medium text-gray-900">{relatedName}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Current document */}
          {loadingDoc ? (
            <p className="text-sm text-gray-600">{t('simpleDocUpdate.loading')}</p>
          ) : currentDoc ? (
            <div className="border border-gray-200 rounded-lg p-3 bg-white flex items-start gap-3">
              <FileText className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{currentDoc.fileName}</p>
                <p className="text-xs text-gray-500 mt-0.5">{formatFileSize(currentDoc.fileSize)}</p>
              </div>
              <button
                onClick={downloadCurrent}
                className="text-xs font-medium text-primary-600 hover:text-primary-700 flex-shrink-0"
              >
                {t('simpleDocUpdate.download')}
              </button>
            </div>
          ) : (
            <div className="border border-dashed border-gray-300 rounded-lg p-3 text-center">
              <p className="text-sm text-gray-500">{t('simpleDocUpdate.noCurrentDoc')}</p>
            </div>
          )}

          {/* File input — replace or upload first */}
          <FileInput
            label={currentDoc ? t('simpleDocUpdate.replaceFile') : t('simpleDocUpdate.selectFile')}
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileSelected}
            selectedFileName={selectedFile ? `${selectedFile.name} (${formatFileSize(selectedFile.size)})` : null}
          />

          {/* Expiry date — pre-populated from current doc */}
          <TextInput
            label={t('simpleDocUpdate.expiryDate')}
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-200 sticky bottom-0 bg-white">
          {currentDoc && (
            <button
              onClick={() => setPendingDelete(true)}
              className="px-3 py-2 text-sm border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50"
              disabled={isSaving}
            >
              {t('simpleDocUpdate.delete')}
            </button>
          )}
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            disabled={isSaving}
          >
            {t('simpleDocUpdate.close')}
          </button>
          <button
            onClick={handleSave}
            disabled={!expiryDate || isSaving || (!selectedFile && expiryDate === (currentDoc?.expiryDate ?? ''))}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            {isSaving ? t('simpleDocUpdate.uploading') : t('simpleDocUpdate.saveBtn')}
          </button>
        </div>
      </div>

      {pendingDelete && currentDoc && (
        <ConfirmActionModal
          title={t('confirmDelete.document.title')}
          description={t('confirmDelete.document.description', { filename: currentDoc.fileName })}
          bullets={[t('common.irreversible')]}
          confirmLabel={t('common.delete')}
          tone="danger"
          onConfirm={runDeleteCurrent}
          onClose={() => setPendingDelete(false)}
        />
      )}
    </div>
  );
};

export default SimpleDocumentUpdateModal;
