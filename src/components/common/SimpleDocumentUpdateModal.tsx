import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { truckApi, driverApi } from '../../services/api';
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
  currentExpiryDate,
  onUpdate,
}: SimpleDocumentUpdateModalProps) => {
  const [expiryDate, setExpiryDate] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documents, setDocuments] = useState<TruckDocument[]>([]);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editingExpiry, setEditingExpiry] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDocuments();
    }
  }, [isOpen, relatedId, category]);

  const loadDocuments = async () => {
    setLoadingDocs(true);
    try {
      const allDocs = relatedType === 'driver'
        ? await driverApi.getDocuments(relatedId)
        : await truckApi.getDocuments(relatedId);
      // Filter documents by category
      const filtered = allDocs.filter((doc: TruckDocument) => doc.documentType === category);
      setDocuments(filtered);
    } catch (err) {
      console.error('Error loading documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  if (!isOpen) return null;

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Lütfen bir dosya seçin');
      return;
    }

    if (!expiryDate) {
      setError('Lütfen geçerlilik tarihi girin');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      if (relatedType === 'driver') {
        await driverApi.uploadDocument(relatedId, selectedFile, category, expiryDate);
      } else {
        await truckApi.uploadDocument(relatedId, selectedFile, category, expiryDate);
      }

      toast.success('Belge başarıyla yüklendi');
      setSelectedFile(null);
      setExpiryDate('');
      await loadDocuments(); // Reload documents list
      // Also update the expiry date in the parent
      await onUpdate(category, expiryDate);
    } catch (err) {
      console.error('Error uploading document:', err);
      setError(err instanceof Error ? err.message : 'Belge yüklenirken hata oluştu');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Bu belgeyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      if (relatedType === 'driver') {
        await driverApi.deleteDocument(documentId);
      } else {
        await truckApi.deleteDocument(documentId);
      }
      toast.success('Belge başarıyla silindi');
      await loadDocuments();
      // Refresh parent component to update expiry dates
      await onUpdate(category, '');
    } catch (err) {
      console.error('Error deleting document:', err);
      toast.error('Belge silinirken hata oluştu');
    }
  };

  const handleEditExpiry = (doc: TruckDocument) => {
    setEditingDocId(doc.id);
    setEditingExpiry(doc.expiryDate || '');
  };

  const handleSaveExpiry = async (documentId: string) => {
    if (!editingExpiry) {
      toast.warning('Lütfen geçerlilik tarihi girin');
      return;
    }

    try {
      if (relatedType === 'driver') {
        await driverApi.updateDocumentExpiry(documentId, editingExpiry);
      } else {
        await truckApi.updateDocumentExpiry(documentId, editingExpiry);
      }
      toast.success('Geçerlilik tarihi güncellendi');
      setEditingDocId(null);
      setEditingExpiry('');
      await loadDocuments();
      // Refresh parent component to update expiry dates
      await onUpdate(category, editingExpiry);
    } catch (err) {
      console.error('Error updating expiry:', err);
      toast.error('Tarih güncellenirken hata oluştu');
    }
  };

  const handleCancelEdit = () => {
    setEditingDocId(null);
    setEditingExpiry('');
  };

  const handleClose = () => {
    setExpiryDate('');
    setSelectedFile(null);
    setError(null);
    setIsUploading(false);
    onClose();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <h2 className="text-lg font-bold text-gray-900">
            {getCategoryLabel(category)} Yönetimi
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">
              {relatedType === 'truck' ? 'Araç' : 'Sürücü'}
            </p>
            <p className="text-sm font-medium text-gray-900">{relatedName}</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* File Upload Section */}
          <div className="border-2 border-primary-200 bg-primary-50 rounded-lg p-4 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">📤 Yeni Belge Yükle</h3>
              <p className="text-xs text-gray-600 mt-1">Yeni bir belge dosyası yüklemek için bu bölümü kullanın</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dosya Seç *
              </label>
              <input
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.jpg,.jpeg,.png"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-1">
                  Seçili: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Geçerlilik Tarihi *
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={handleUpload}
              disabled={!selectedFile || !expiryDate || isUploading}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Yükleniyor...' : 'Belgeyi Yükle'}
            </button>
          </div>

          {/* Uploaded Documents List */}
          {(
          <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">📄 Yüklenmiş Belgeler</h3>
              <p className="text-xs text-gray-600 mt-1">
                Mevcut belge tarihlerini güncellemek için <strong>"Tarih Düzenle"</strong> butonuna tıklayın
              </p>
            </div>

            {loadingDocs ? (
              <p className="text-sm text-gray-600">Yükleniyor...</p>
            ) : documents.length === 0 ? (
              <p className="text-sm text-gray-600">Henüz belge yüklenmemiş. Yukarıdaki bölümden yeni belge yükleyebilirsiniz.</p>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className={editingDocId === doc.id ? "bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3" : "bg-white rounded-lg p-3 border border-gray-200"}>
                    {editingDocId === doc.id ? (
                      // Edit mode
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">✏️</span>
                          <p className="text-sm font-medium text-gray-900">{doc.fileName}</p>
                        </div>
                        <div className="bg-white rounded p-2 border border-yellow-300">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Yeni Geçerlilik Tarihi Girin
                          </label>
                          <input
                            type="date"
                            value={editingExpiry}
                            onChange={(e) => setEditingExpiry(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
                          />
                          <p className="text-xs text-gray-600 mt-1">
                            Mevcut: {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveExpiry(doc.id)}
                            className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                          >
                            ✓ Kaydet
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="flex-1 px-3 py-2 text-sm border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                          >
                            ✕ İptal
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View mode
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{doc.fileName}</p>
                          <p className="text-xs text-gray-600">
                            {formatFileSize(doc.fileSize)} •
                            {doc.expiryDate && ` Son geçerlilik: ${new Date(doc.expiryDate).toLocaleDateString('tr-TR')}`} •
                            Yüklenme: {new Date(doc.uploadedAt).toLocaleDateString('tr-TR')}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => handleEditExpiry(doc)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Tarih Düzenle
                          </button>
                          <button
                            onClick={() => relatedType === 'driver' ? driverApi.downloadDocument(doc.id) : truckApi.downloadDocument(doc.id)}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            İndir
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Sil
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-200 sticky bottom-0 bg-white">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimpleDocumentUpdateModal;