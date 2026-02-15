import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { TRIPS, EXPENSES, DOCUMENTS, INVOICES } from '../constants/text';
import { formatCurrency, formatDate } from '../utils/format';
import FileUpload from '../components/common/FileUpload';
import type { Document } from '../types';

const TripDetailPage = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { trips, invoices, updateTrip } = useData();

  const trip = trips.find((t) => t.id === tripId);
  const [documents, setDocuments] = useState<Document[]>(trip?.deliveryDocuments || []);
  const [documentsConfirmed, setDocumentsConfirmed] = useState<boolean>(trip?.documentsConfirmed || false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Sync with context when trip changes
  useEffect(() => {
    if (trip) {
      setDocuments(trip.deliveryDocuments);
      setDocumentsConfirmed(trip.documentsConfirmed);
    }
  }, [trip]);

  // Check if invoice already exists for this trip
  const existingInvoice = invoices.find((inv) => inv.tripIds.includes(tripId || ''));

  if (!trip) {
    return (
      <div className="p-4">
        <p className="text-center text-gray-600">Sefer bulunamadı</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'bg-yellow-100 text-yellow-700';
      case 'in-transit':
        return 'bg-blue-100 text-blue-700';
      case 'delivered':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'assigned':
        return TRIPS.assigned;
      case 'in-transit':
        return TRIPS.inTransit;
      case 'delivered':
        return TRIPS.delivered;
      default:
        return status;
    }
  };

  const totalExpenses =
    trip.expenses.fuel +
    trip.expenses.tolls +
    trip.expenses.driverFee +
    trip.expenses.other;

  const netProfit = trip.revenue - totalExpenses;

  const handleFileSelect = (document: Document) => {
    if (documents.length >= 3) {
      alert(DOCUMENTS.maxLimit);
      return;
    }
    setDocuments([...documents, document]);
  };

  const handleConfirmDocuments = () => {
    if (!trip || documents.length === 0) return;

    const confirmed = window.confirm(
      `${documents.length} adet teslimat belgesini onaylıyor musunuz?\n\nOnayladıktan sonra bu sefer fatura oluşturma için hazır olacak.`
    );

    if (confirmed) {
      // Update the trip in the global context
      updateTrip(trip.id, {
        deliveryDocuments: documents,
        documentsConfirmed: true,
      });
      setDocumentsConfirmed(true);
      alert('✓ Belgeler onaylandı! Seferler sayfasında "Fatura Hazır" sekmesinde görünecek.');
    }
  };

  const handleDocumentClick = (doc: Document) => {
    setSelectedDocument(doc);
  };

  const closeModal = () => {
    setSelectedDocument(null);
  };

  return (
    <div className="p-4 pb-20">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-2xl text-gray-600 hover:text-gray-900 transition-colors"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">
            {trip.originCity} → {trip.destinationCity}
          </h1>
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
            {getStatusLabel(trip.status)}
          </span>
        </div>
      </div>

      {/* Trip info card */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">{TRIPS.tripInfo}</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{TRIPS.client}</span>
            <span className="text-sm font-medium text-gray-900">{trip.clientName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{TRIPS.truck}</span>
            <span className="text-sm font-medium text-gray-900">{trip.truckPlate}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{TRIPS.driver}</span>
            <span className="text-sm font-medium text-gray-900">{trip.driverName}</span>
          </div>
        </div>
      </div>

      {/* Financial summary */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">{TRIPS.financial}</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">{TRIPS.revenue}</span>
            <span className="text-sm font-bold text-green-600">{formatCurrency(trip.revenue)}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-gray-600 pl-3">{EXPENSES.fuel}</span>
            <span className="text-sm text-gray-600">{formatCurrency(trip.expenses.fuel)}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-gray-600 pl-3">{EXPENSES.tolls}</span>
            <span className="text-sm text-gray-600">{formatCurrency(trip.expenses.tolls)}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-gray-600 pl-3">{EXPENSES.driverFee}</span>
            <span className="text-sm text-gray-600">{formatCurrency(trip.expenses.driverFee)}</span>
          </div>
          {trip.expenses.other > 0 && (
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-gray-600 pl-3">{EXPENSES.other}</span>
              <span className="text-sm text-gray-600">{formatCurrency(trip.expenses.other)}</span>
            </div>
          )}
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-900">{TRIPS.netProfit}</span>
            <span className={`text-sm font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">{TRIPS.timeline}</h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-600 mb-1">{TRIPS.created}</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(trip.createdAt)}</p>
          </div>
          {trip.startedAt && (
            <div>
              <p className="text-xs text-gray-600 mb-1">{TRIPS.started}</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(trip.startedAt)}</p>
            </div>
          )}
          {trip.completedAt ? (
            <div>
              <p className="text-xs text-gray-600 mb-1">{TRIPS.completedAt}</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(trip.completedAt)}</p>
            </div>
          ) : trip.estimatedArrival ? (
            <div>
              <p className="text-xs text-gray-600 mb-1">{TRIPS.estimated}</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(trip.estimatedArrival)}</p>
            </div>
          ) : null}
        </div>
      </div>

      {/* Delivery documents section */}
      {trip.status === 'delivered' && (
        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">{DOCUMENTS.deliveryConfirmation}</h2>

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
              {DOCUMENTS.noDocuments}
            </p>
          )}

          {/* Upload button - only show if less than 3 documents */}
          {documents.length < 3 && (
            <FileUpload onFileSelect={handleFileSelect} />
          )}

          {documents.length >= 3 && (
            <p className="text-xs text-center text-gray-500 mt-3">
              {DOCUMENTS.maxLimit}
            </p>
          )}
        </div>
      )}

      {/* Document Confirmation & Invoice Section */}
      {trip?.status === 'delivered' && (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Belge Onayı ve Fatura</h2>

          {existingInvoice ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800 mb-2">
                ✓ Bu sefer için fatura oluşturulmuş
              </p>
              <button
                onClick={() => navigate(`/invoices/${existingInvoice.id}`)}
                className="text-sm text-green-700 font-medium underline"
              >
                Faturayı Görüntüle →
              </button>
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ Fatura oluşturmak için önce teslimat belgesi yüklemeniz gerekiyor
              </p>
            </div>
          ) : !documentsConfirmed ? (
            <div>
              <p className="text-sm text-gray-600 mb-3">
                {documents.length} adet teslimat belgesi yüklendi. Belgeleri kontrol edip onaylayın.
              </p>
              <button
                onClick={handleConfirmDocuments}
                className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-lg">✓</span>
                <span>{DOCUMENTS.confirmDocuments}</span>
              </button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800 mb-3">
                ✓ {DOCUMENTS.documentsConfirmed}
              </p>
              <p className="text-sm text-gray-700 mb-3">
                {DOCUMENTS.readyForInvoicing}
              </p>
              <button
                onClick={() => navigate('/invoices/create')}
                className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 active:bg-primary-800 transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-lg">📄</span>
                <span>{INVOICES.createMultiTripInvoice}</span>
              </button>
            </div>
          )}
        </div>
      )}

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
            <div className="bg-white p-3 rounded-lg mt-2">
              <p className="text-sm font-medium text-gray-900">{selectedDocument.name}</p>
              <p className="text-xs text-gray-500">{formatDate(selectedDocument.uploadedAt)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDetailPage;
