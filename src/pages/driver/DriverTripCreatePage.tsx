import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import FileUpload from '../../components/common/FileUpload';
import type { Document } from '../../types';

const DriverTripCreatePage = () => {
  const navigate = useNavigate();
  const { addTrip } = useData();
  const { user } = useAuth();

  const [destination, setDestination] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  const handleFileSelect = (document: Document) => {
    if (documents.length >= 3) {
      alert('En fazla 3 belge yükleyebilirsiniz');
      return;
    }
    setDocuments([...documents, document]);
  };

  const handleSubmit = () => {
    if (documents.length === 0) {
      alert('⚠️ Lütfen en az 1 teslimat belgesi yükleyin');
      return;
    }

    if (!destination.trim()) {
      alert('⚠️ Lütfen teslimat adresi girin');
      return;
    }

    // Create new trip with POD (goes directly to 'delivered' status)
    const newTrip = {
      id: `trip-driver-${Date.now()}`,
      fleetId: 'fleet-1',
      driverId: user?.driverId || null,
      driverName: user?.name || null,
      driverEnteredDestination: destination,
      originCity: 'Bilinmiyor', // Driver may not know
      destinationCity: destination.split('-')[0].trim() || destination,
      clientId: null, // Manager will fill
      clientName: null,
      truckId: null, // Manager will fill
      truckPlate: null,
      cargoDescription: null, // Manager will fill
      revenue: null,
      status: 'delivered' as const, // Goes directly to delivered (pending approval)
      isPlanned: false, // POD-first workflow
      deliveryDocuments: documents,
      deliveredAt: new Date().toISOString(),
      approvedByManager: false,
      approvedAt: null,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      estimatedArrival: null,
      expenses: {
        fuel: 0,
        tolls: 0,
        driverFee: 0,
        other: 0,
        otherReason: '',
      },
      documentsConfirmed: false,
      invoiced: false,
    };

    // Add trip to context
    addTrip(newTrip);

    alert(
      `✓ Teslimat belgesi yüklendi!\n\nHedef: ${destination}\n${documents.length} belge\n\nYöneticiniz inceleyecek ve onaylayacak.`
    );
    navigate('/driver');
  };

  const handleDocumentClick = (doc: Document) => {
    setSelectedDocument(doc);
  };

  const closeModal = () => {
    setSelectedDocument(null);
  };

  return (
    <div className="p-4 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-2xl text-gray-600 hover:text-gray-900 transition-colors"
        >
          ←
        </button>
        <h1 className="text-xl font-bold text-gray-900">Teslimat Belgesi Yükle</h1>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          📸 Teslimat yaptıktan sonra belge yükleyin. Yöneticiniz detayları tamamlayıp
          onaylayacak.
        </p>
      </div>

      {/* Destination Input */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <label className="text-sm font-medium text-gray-700 block mb-2">
          Teslimat Adresi *
        </label>
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Örn: Ankara - İnönü Caddesi No:45"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="text-xs text-gray-500 mt-1">
          Teslimat yaptığınız adresi girin
        </p>
      </div>

      {/* Document Upload */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          Teslimat Belgeleri *
        </h2>

        {/* Uploaded documents grid */}
        {documents.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => handleDocumentClick(doc)}
                className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-primary-500 transition-colors"
              >
                <img
                  src={doc.dataUrl}
                  alt={doc.name}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {documents.length === 0 && (
          <p className="text-sm text-gray-500 text-center py-4 mb-4">
            Henüz belge yüklenmedi
          </p>
        )}

        {/* Upload button */}
        {documents.length < 3 && <FileUpload onFileSelect={handleFileSelect} />}

        {documents.length >= 3 && (
          <p className="text-xs text-center text-gray-500 mt-3">
            En fazla 3 belge yükleyebilirsiniz
          </p>
        )}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={documents.length === 0 || !destination.trim()}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          documents.length > 0 && destination.trim()
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
      >
        {documents.length > 0 ? '✓ Belgeleri Gönder' : '📸 Önce Belge Yükleyin'}
      </button>

      {/* Full-size image modal */}
      {selectedDocument && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl font-bold text-gray-900 hover:bg-gray-100 transition-colors"
            >
              ×
            </button>
            <img
              src={selectedDocument.dataUrl}
              alt={selectedDocument.name}
              className="max-w-full max-h-[80vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverTripCreatePage;
