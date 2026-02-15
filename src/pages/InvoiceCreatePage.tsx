import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { mockTrips } from '../data/mock';
import { INVOICES } from '../constants/text';
import { formatCurrency, formatDate } from '../utils/format';
import type { Trip } from '../types';

const InvoiceCreatePage = () => {
  const navigate = useNavigate();
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);

  // Get trips that are ready for invoicing:
  // - status: delivered
  // - documentsConfirmed: true
  // - invoiced: false
  const availableTrips = useMemo(() => {
    return mockTrips.filter(
      (trip) =>
        trip.status === 'delivered' &&
        trip.documentsConfirmed === true &&
        trip.invoiced === false
    );
  }, []);

  // Group trips by client
  const tripsByClient = useMemo(() => {
    const grouped: Record<string, Trip[]> = {};
    availableTrips.forEach((trip) => {
      if (!grouped[trip.clientId]) {
        grouped[trip.clientId] = [];
      }
      grouped[trip.clientId].push(trip);
    });
    return grouped;
  }, [availableTrips]);

  // Calculate selected trips summary
  const selectedTrips = useMemo(() => {
    return mockTrips.filter((trip) => selectedTripIds.includes(trip.id));
  }, [selectedTripIds]);

  const selectedClient = useMemo(() => {
    if (selectedTrips.length === 0) return null;
    return selectedTrips[0].clientName;
  }, [selectedTrips]);

  const totalAmount = useMemo(() => {
    return selectedTrips.reduce((sum, trip) => sum + trip.revenue, 0);
  }, [selectedTrips]);

  const handleToggleTrip = (tripId: string, clientId: string) => {
    setSelectedTripIds((prev) => {
      // If this is the first selection, just add it
      if (prev.length === 0) {
        return [tripId];
      }

      // Check if we're trying to select a trip from a different client
      const firstSelectedTrip = mockTrips.find((t) => t.id === prev[0]);
      if (firstSelectedTrip && firstSelectedTrip.clientId !== clientId) {
        alert('Farklı müşterilere ait seferleri aynı faturada birleştiremezsiniz!');
        return prev;
      }

      // Toggle selection
      if (prev.includes(tripId)) {
        return prev.filter((id) => id !== tripId);
      } else {
        return [...prev, tripId];
      }
    });
  };

  const handleGenerateInvoice = () => {
    if (selectedTrips.length === 0) {
      alert('Lütfen en az bir sefer seçin');
      return;
    }

    const confirmed = window.confirm(
      `${selectedClient} için ${selectedTrips.length} sefer içeren fatura oluşturulsun mu?\n\nToplam Tutar: ${formatCurrency(totalAmount)}`
    );

    if (confirmed) {
      alert('✓ Fatura oluşturuldu! Ödemeler sayfasından görüntüleyebilirsiniz.');
      // In a real app, this would:
      // 1. Create the invoice via API
      // 2. Mark the selected trips as invoiced
      // 3. Navigate to the new invoice detail page
      navigate('/invoices');
    }
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
        <h1 className="text-2xl font-bold text-gray-900">{INVOICES.createMultiTripInvoice}</h1>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-800">
          💡 Belgeleri onaylanmış seferleri seçerek tek bir fatura oluşturabilirsiniz. Aynı müşteriye ait seferleri seçebilirsiniz.
        </p>
      </div>

      {/* Selected trips summary */}
      {selectedTrips.length > 0 && (
        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Seçili Seferler</h2>
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <div>
              <p className="text-sm text-gray-600">Müşteri:</p>
              <p className="text-sm font-medium text-gray-900">{selectedClient}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">{INVOICES.trips}:</p>
              <p className="text-sm font-medium text-gray-900">{selectedTrips.length}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-900">Toplam Tutar:</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(totalAmount)}</p>
          </div>
          <button
            onClick={handleGenerateInvoice}
            className="w-full mt-3 py-3 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 active:bg-primary-800 transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-lg">📄</span>
            <span>Fatura Oluştur</span>
          </button>
        </div>
      )}

      {/* Available trips grouped by client */}
      {Object.keys(tripsByClient).length === 0 ? (
        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <p className="text-gray-600 mb-2">
            Fatura oluşturulabilecek onaylanmış sefer bulunmuyor.
          </p>
          <p className="text-sm text-gray-500">
            Seferler tamamlandıktan ve teslimat belgeleri onaylandıktan sonra burada görünecek.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Müşterilere Göre Seferler</h2>
          {Object.entries(tripsByClient).map(([clientId, trips]) => (
            <div key={clientId} className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-bold text-gray-900 mb-3">{trips[0].clientName}</h3>
              <div className="space-y-2">
                {trips.map((trip) => {
                  const isSelected = selectedTripIds.includes(trip.id);
                  const isDisabled = selectedTripIds.length > 0 && !isSelected && selectedTrips[0].clientId !== clientId;

                  return (
                    <button
                      key={trip.id}
                      onClick={() => handleToggleTrip(trip.id, clientId)}
                      disabled={isDisabled}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50'
                          : isDisabled
                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 bg-white hover:border-primary-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-primary-600 bg-primary-600'
                              : 'border-gray-300 bg-white'
                          }`}>
                            {isSelected && (
                              <span className="text-white text-xs">✓</span>
                            )}
                          </div>
                          <span className="font-medium text-gray-900">
                            {trip.originCity} → {trip.destinationCity}
                          </span>
                        </div>
                        <span className="font-bold text-green-600">
                          {formatCurrency(trip.revenue)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 pl-7">
                        <span>{trip.truckPlate}</span>
                        <span>{formatDate(trip.completedAt!)}</span>
                      </div>
                      {trip.deliveryDocuments.length > 0 && (
                        <p className="text-xs text-green-600 mt-2 pl-7">
                          ✓ {trip.deliveryDocuments.length} teslimat belgesi onaylandı
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InvoiceCreatePage;
