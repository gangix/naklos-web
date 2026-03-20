import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useFleet } from '../contexts/FleetContext';
import { invoiceApi } from '../services/api';
import { INVOICES } from '../constants/text';
import { formatCurrency, formatDate } from '../utils/format';
import type { Trip } from '../types';

const InvoiceCreatePage = () => {
  const navigate = useNavigate();
  const { trips, addInvoice } = useData();
  const { fleetId } = useFleet();
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get trips that are ready for invoicing from real data
  const availableTrips = useMemo(() => {
    return trips.filter(
      (trip: any) =>
        trip.status === 'APPROVED' &&
        trip.approvedByManager === true &&
        trip.invoiced === false &&
        trip.clientId !== null &&
        trip.revenue !== null
    );
  }, [trips]);

  // Group trips by client
  const tripsByClient = useMemo(() => {
    const grouped: Record<string, Trip[]> = {};
    availableTrips.forEach((trip: any) => {
      if (trip.clientId && !grouped[trip.clientId]) {
        grouped[trip.clientId] = [];
      }
      if (trip.clientId) {
        grouped[trip.clientId].push(trip);
      }
    });
    return grouped;
  }, [availableTrips]);

  // Calculate selected trips summary
  const selectedTrips = useMemo(() => {
    return availableTrips.filter((trip: any) => selectedTripIds.includes(trip.id));
  }, [selectedTripIds, availableTrips]);

  const selectedClient = useMemo(() => {
    if (selectedTrips.length === 0) return null;
    return (selectedTrips[0] as any).clientName;
  }, [selectedTrips]);

  const selectedClientId = useMemo(() => {
    if (selectedTrips.length === 0) return null;
    return (selectedTrips[0] as any).clientId;
  }, [selectedTrips]);

  const totalAmount = useMemo(() => {
    return selectedTrips.reduce((sum, trip: any) => sum + (trip.revenue?.amount ?? trip.revenue ?? 0), 0);
  }, [selectedTrips]);

  const handleToggleTrip = (tripId: string, clientId: string | null) => {
    if (!clientId) return;

    setSelectedTripIds((prev) => {
      if (prev.length === 0) {
        return [tripId];
      }

      // Check if selecting a trip from a different client
      const firstSelectedTrip = availableTrips.find((t: any) => t.id === prev[0]);
      if (firstSelectedTrip && (firstSelectedTrip as any).clientId !== clientId) {
        alert('Farklı müşterilere ait seferleri aynı faturada birleştiremezsiniz!');
        return prev;
      }

      if (prev.includes(tripId)) {
        return prev.filter((id) => id !== tripId);
      } else {
        return [...prev, tripId];
      }
    });
  };

  const handleGenerateInvoice = async () => {
    if (selectedTrips.length === 0) {
      alert('Lütfen en az bir sefer seçin');
      return;
    }
    if (!fleetId || !selectedClientId || !selectedClient) return;

    const confirmed = window.confirm(
      `${selectedClient} için ${selectedTrips.length} sefer içeren fatura oluşturulsun mu?\n\nToplam Tutar: ${formatCurrency(totalAmount)}`
    );

    if (!confirmed) return;

    // Due date: 30 days from today
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    const dueDateStr = dueDate.toISOString().split('T')[0];

    setIsSubmitting(true);
    try {
      const invoice = await invoiceApi.create(
        {
          clientId: selectedClientId,
          clientName: selectedClient,
          tripIds: selectedTripIds,
          dueDate: dueDateStr,
        },
        fleetId
      );
      addInvoice(invoice as any);
      navigate('/manager/invoices');
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Fatura oluşturulurken hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSubmitting(false);
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
            disabled={isSubmitting}
            className="w-full mt-3 py-3 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 active:bg-primary-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span className="text-lg">📄</span>
            <span>{isSubmitting ? 'Oluşturuluyor...' : 'Fatura Oluştur'}</span>
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
                          {formatCurrency(trip.revenue || 0)}
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
