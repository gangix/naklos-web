import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TRIPS } from '../constants/text';
import { formatCurrency, formatDate } from '../utils/format';
import { useData } from '../contexts/DataContext';
import type { TripStatus, Trip } from '../types';

const TripsPage = () => {
  const navigate = useNavigate();
  const { trips, updateTrip, addInvoice } = useData();
  const [tab, setTab] = useState<'active' | 'ready'>('active');
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);

  // Active trips: in-transit + delivered but not yet confirmed
  const activeTrips = useMemo(() => {
    return trips.filter(
      (trip) => trip.status !== 'delivered' || !trip.documentsConfirmed
    );
  }, [trips]);

  // Ready trips: delivered + confirmed + not invoiced (ready for invoicing)
  const readyTrips = useMemo(() => {
    return trips.filter(
      (trip) =>
        trip.status === 'delivered' &&
        trip.documentsConfirmed &&
        !trip.invoiced
    );
  }, [trips]);

  const displayedTrips = tab === 'active' ? activeTrips : readyTrips;

  // Selected trips summary
  const selectedTrips = useMemo(() => {
    return readyTrips.filter((trip) => selectedTripIds.includes(trip.id));
  }, [selectedTripIds, readyTrips]);

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
      const firstSelectedTrip = readyTrips.find((t) => t.id === prev[0]);
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

  const handleConfirmAndInvoice = () => {
    if (selectedTrips.length === 0) {
      alert('Lütfen en az bir sefer seçin');
      return;
    }

    const confirmed = window.confirm(
      `${selectedClient} için ${selectedTrips.length} sefer onaylanacak ve fatura oluşturulacak.\n\nToplam Tutar: ${formatCurrency(totalAmount)}\n\nOnaylıyor musunuz?`
    );

    if (confirmed) {
      // Mark all selected trips as invoiced
      selectedTripIds.forEach((tripId) => {
        updateTrip(tripId, { invoiced: true });
      });

      // Create the invoice
      const newInvoice = {
        id: `invoice-${Date.now()}`,
        fleetId: 'fleet-1',
        clientId: selectedTrips[0].clientId,
        clientName: selectedTrips[0].clientName,
        tripIds: selectedTripIds,
        amount: totalAmount,
        status: 'pending' as const,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        paidDate: null,
      };
      addInvoice(newInvoice);

      alert(
        `✓ ${selectedTrips.length} sefer onaylandı ve fatura oluşturuldu!\n\nFaturayı Ödemeler sayfasından görüntüleyebilirsiniz.`
      );
      setSelectedTripIds([]);
      navigate('/invoices');
    }
  };

  const getStatusColor = (status: TripStatus) => {
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

  const getStatusLabel = (status: TripStatus) => {
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

  const getTripActionLabel = (trip: Trip) => {
    if (trip.status === 'delivered' && trip.deliveryDocuments.length === 0) {
      return { label: '📸 Belge Yükle', color: 'bg-blue-600 text-white' };
    } else if (
      trip.status === 'delivered' &&
      trip.deliveryDocuments.length > 0 &&
      !trip.documentsConfirmed
    ) {
      return { label: '✅ Onayla', color: 'bg-green-600 text-white' };
    }
    return null;
  };

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{TRIPS.title}</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => {
            setTab('active');
            setSelectedTripIds([]);
          }}
          className={`px-4 py-2 font-medium ${
            tab === 'active'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600'
          }`}
        >
          Aktif ({activeTrips.length})
        </button>
        <button
          onClick={() => {
            setTab('ready');
            setSelectedTripIds([]);
          }}
          className={`px-4 py-2 font-medium ${
            tab === 'ready'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600'
          }`}
        >
          Fatura Hazır ({readyTrips.length})
        </button>
      </div>

      {/* Active Tab - Trip cards with actions */}
      {tab === 'active' && (
        <div className="space-y-3">
          {displayedTrips.length === 0 ? (
            <div className="bg-white rounded-lg p-6 text-center text-gray-600">
              Aktif sefer bulunmuyor
            </div>
          ) : (
            displayedTrips.map((trip) => {
              const action = getTripActionLabel(trip);
              return (
                <div
                  key={trip.id}
                  className="bg-white rounded-lg p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-bold text-gray-900">
                        {trip.originCity} → {trip.destinationCity}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {trip.clientName}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        trip.status
                      )}`}
                    >
                      {getStatusLabel(trip.status)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t border-gray-100">
                    <span>{trip.truckPlate}</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(trip.revenue)}
                    </span>
                  </div>

                  {/* Action button or status indicator */}
                  {action ? (
                    <Link
                      to={`/trips/${trip.id}`}
                      className={`mt-3 w-full py-2 px-4 rounded-lg font-medium text-center block ${action.color}`}
                    >
                      {action.label}
                    </Link>
                  ) : (
                    <Link
                      to={`/trips/${trip.id}`}
                      className="mt-3 w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium text-center block"
                    >
                      Detayları Gör
                    </Link>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Ready Tab - Multi-select with bottom action bar */}
      {tab === 'ready' && (
        <>
          <div className="space-y-3 pb-20">
            {displayedTrips.length === 0 ? (
              <div className="bg-white rounded-lg p-6 text-center text-gray-600">
                <p className="mb-2">Fatura oluşturmaya hazır sefer bulunmuyor.</p>
                <p className="text-sm text-gray-500">
                  Seferler tamamlanıp belgeleri onaylandıktan sonra burada
                  görünecek.
                </p>
              </div>
            ) : (
              displayedTrips.map((trip) => {
                const isSelected = selectedTripIds.includes(trip.id);
                const isDisabled =
                  selectedTripIds.length > 0 &&
                  !isSelected &&
                  selectedTrips[0].clientId !== trip.clientId;

                return (
                  <button
                    key={trip.id}
                    onClick={() => handleToggleTrip(trip.id, trip.clientId)}
                    disabled={isDisabled}
                    className={`w-full text-left bg-white rounded-lg p-4 shadow-sm transition-all ${
                      isSelected
                        ? 'ring-2 ring-primary-600 bg-primary-50'
                        : isDisabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <div
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected
                            ? 'border-primary-600 bg-primary-600'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {isSelected && (
                          <span className="text-white text-sm">✓</span>
                        )}
                      </div>

                      {/* Trip info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-bold text-gray-900">
                              {trip.originCity} → {trip.destinationCity}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {trip.clientName}
                            </p>
                          </div>
                          <span className="font-bold text-green-600 text-lg">
                            {formatCurrency(trip.revenue)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                          <span>{trip.truckPlate}</span>
                          <span>{formatDate(trip.completedAt!)}</span>
                        </div>

                        {trip.deliveryDocuments.length > 0 && (
                          <p className="text-xs text-green-600 mt-2">
                            ✓ {trip.deliveryDocuments.length} belge onaylandı
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Bottom Action Bar */}
          {selectedTrips.length > 0 && (
            <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-600">
                    {selectedTrips.length} sefer seçildi
                  </p>
                  <p className="text-sm font-medium text-gray-900">
                    {selectedClient}
                  </p>
                </div>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
              <button
                onClick={handleConfirmAndInvoice}
                className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 active:bg-primary-800 transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-lg">✅</span>
                <span>Onayla ve Fatura Oluştur</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TripsPage;
