import { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { TRIPS } from '../constants/text';
import { formatCurrency, formatDate } from '../utils/format';
import { useData } from '../contexts/DataContext';
import type { TripStatus, Trip } from '../types';

const TripsPage = () => {
  const navigate = useNavigate();
  const { trips, updateTrip, addInvoice } = useData();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'planned' | 'pending' | 'ready'>('planned');
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([]);

  // Handle query param for auto-tab selection
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'pending' || tabParam === 'planned' || tabParam === 'ready') {
      setTab(tabParam);
    }
  }, [searchParams]);

  // Planned trips: created or in-progress (before delivery)
  const plannedTrips = useMemo(() => {
    return trips.filter(
      (trip) =>
        trip.isPlanned &&
        (trip.status === 'created' || trip.status === 'in-progress')
    );
  }, [trips]);

  // Pending approval: POD uploaded (delivered status), awaiting manager approval
  const pendingTrips = useMemo(() => {
    return trips.filter(
      (trip) =>
        trip.status === 'delivered' &&
        trip.deliveryDocuments.length > 0
    );
  }, [trips]);

  // Ready to invoice: approved trips not yet invoiced
  const readyTrips = useMemo(() => {
    return trips.filter(
      (trip) => trip.status === 'approved' && trip.approvedByManager && !trip.invoiced
    );
  }, [trips]);

  const displayedTrips =
    tab === 'planned' ? plannedTrips :
    tab === 'pending' ? pendingTrips :
    readyTrips;

  // Selected trips summary
  const selectedTrips = useMemo(() => {
    return readyTrips.filter((trip) => selectedTripIds.includes(trip.id));
  }, [selectedTripIds, readyTrips]);

  const selectedClient = useMemo(() => {
    if (selectedTrips.length === 0) return null;
    return selectedTrips[0].clientName;
  }, [selectedTrips]);

  const totalAmount = useMemo(() => {
    return selectedTrips.reduce((sum, trip) => sum + (trip.revenue || 0), 0);
  }, [selectedTrips]);

  const handleToggleTrip = (tripId: string, clientId: string | null) => {
    if (!clientId) return;

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

  const handleGenerateInvoice = () => {
    if (selectedTrips.length === 0) {
      alert('Lütfen en az bir sefer seçin');
      return;
    }

    const confirmed = window.confirm(
      `${selectedClient} için ${selectedTrips.length} sefer fatura oluşturulacak.\n\nToplam Tutar: ${formatCurrency(totalAmount)}\n\nOnaylıyor musunuz?`
    );

    if (confirmed) {
      // Mark all selected trips as invoiced
      selectedTripIds.forEach((tripId) => {
        updateTrip(tripId, { invoiced: true, status: 'invoiced' });
      });

      // Create the invoice
      const newInvoice = {
        id: `invoice-${Date.now()}`,
        fleetId: 'fleet-1',
        clientId: selectedTrips[0].clientId!,
        clientName: selectedTrips[0].clientName!,
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
        `✓ Fatura oluşturuldu!\n\n${selectedTrips.length} sefer faturalandı.\n\nFaturayı Ödemeler sayfasından görüntüleyebilirsiniz.`
      );
      setSelectedTripIds([]);
      navigate('/manager/invoices');
    }
  };

  const getStatusColor = (status: TripStatus) => {
    switch (status) {
      case 'created':
        return 'bg-gray-100 text-gray-700';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700';
      case 'delivered':
        return 'bg-orange-100 text-orange-700';
      case 'approved':
        return 'bg-emerald-100 text-emerald-700';
      case 'invoiced':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: TripStatus) => {
    switch (status) {
      case 'created':
        return 'Oluşturuldu';
      case 'in-progress':
        return 'Devam Ediyor';
      case 'delivered':
        return 'Onay Bekliyor';
      case 'approved':
        return 'Onaylandı';
      case 'invoiced':
        return 'Faturalandı';
      default:
        return status;
    }
  };

  // Get card styling based on trip completeness and status
  const getTripCardStyle = (trip: Trip) => {
    // Check what's missing
    const hasTruck = !!trip.truckPlate;
    const hasDriver = !!trip.driverName;
    const hasClient = !!trip.clientName;
    const hasRevenue = !!trip.revenue;

    // Unassigned trip (created, missing truck/driver)
    if (trip.status === 'created' && (!hasTruck || !hasDriver)) {
      return {
        bgColor: 'bg-amber-50',
        borderColor: 'border-l-4 border-amber-400',
        statusBadge: 'bg-amber-100 text-amber-700',
        label: 'Atanmamış'
      };
    }

    // Assigned but in progress
    if (trip.status === 'in-progress') {
      return {
        bgColor: 'bg-blue-50',
        borderColor: 'border-l-4 border-blue-400',
        statusBadge: 'bg-blue-100 text-blue-700',
        label: 'Devam Ediyor'
      };
    }

    // Missing client or revenue info
    if (trip.status === 'created' && (!hasClient || !hasRevenue)) {
      return {
        bgColor: 'bg-orange-50',
        borderColor: 'border-l-4 border-orange-400',
        statusBadge: 'bg-orange-100 text-orange-700',
        label: 'Eksik Bilgi'
      };
    }

    // Planned trip with all info (created status, ready to start)
    if (trip.status === 'created') {
      return {
        bgColor: 'bg-white',
        borderColor: 'border-l-4 border-green-400',
        statusBadge: 'bg-green-100 text-green-700',
        label: 'Planlanmış'
      };
    }

    // Other statuses (shouldn't normally appear in planned tab)
    return {
      bgColor: 'bg-white',
      borderColor: 'border-l-4 border-gray-400',
      statusBadge: 'bg-gray-100 text-gray-700',
      label: 'Hazır'
    };
  };

  // Get missing information for a trip
  const getMissingInfo = (trip: Trip) => {
    const missing = [];
    if (!trip.truckPlate) missing.push('Araç');
    if (!trip.driverName) missing.push('Sürücü');
    if (!trip.clientName) missing.push('Müşteri');
    if (!trip.revenue) missing.push('Ücret');
    return missing;
  };

  const getTripActionLabel = (_trip: Trip, tabContext: string) => {
    if (tabContext === 'planned') {
      // Show "Detaylar" button for all planned trips (created or in-progress)
      return { label: 'Detaylar', color: 'bg-blue-600 text-white' };
    } else if (tabContext === 'pending') {
      return { label: '👁 İncele ve Onayla', color: 'bg-orange-600 text-white' };
    }
    return null;
  };

  return (
    <div className="p-4 pb-24">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{TRIPS.title || 'Seferler'}</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => {
            setTab('planned');
            setSelectedTripIds([]);
          }}
          className={`px-4 py-2 font-medium whitespace-nowrap ${
            tab === 'planned'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600'
          }`}
        >
          Planlanmış ({plannedTrips.length})
        </button>
        {pendingTrips.length > 0 && (
          <button
            onClick={() => {
              setTab('pending');
              setSelectedTripIds([]);
            }}
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              tab === 'pending'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600'
            }`}
          >
            Onay Bekliyor ({pendingTrips.length})
          </button>
        )}
        {readyTrips.length > 0 && (
          <button
            onClick={() => {
              setTab('ready');
              setSelectedTripIds([]);
            }}
            className={`px-4 py-2 font-medium whitespace-nowrap ${
              tab === 'ready'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-gray-600'
            }`}
          >
            Fatura Hazır ({readyTrips.length})
          </button>
        )}
      </div>

      {/* Planned Tab */}
      {tab === 'planned' && (
        <div className="space-y-3">
          {displayedTrips.length === 0 ? (
            <div className="bg-white rounded-lg p-6 text-center text-gray-600">
              <p className="mb-2">Planlanmış sefer bulunmuyor</p>
              <p className="text-sm text-gray-500">
                Yeni bir sefer oluşturmak için + butonunu kullanın
              </p>
            </div>
          ) : (
            displayedTrips.map((trip) => {
              const action = getTripActionLabel(trip, 'planned');
              const cardStyle = getTripCardStyle(trip);
              const missingInfo = getMissingInfo(trip);

              return (
                <div
                  key={trip.id}
                  className={`${cardStyle.bgColor} ${cardStyle.borderColor} rounded-lg p-4 shadow-sm`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">
                        {trip.originCity} → {trip.destinationCity}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {trip.clientName || 'Müşteri atanmadı'}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${cardStyle.statusBadge}`}
                    >
                      {cardStyle.label}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t border-gray-100">
                    <span>{trip.truckPlate || 'Araç atanmadı'}</span>
                    {trip.revenue && (
                      <span className="font-bold text-green-600">
                        {formatCurrency(trip.revenue)}
                      </span>
                    )}
                  </div>

                  {/* Missing information indicator */}
                  {missingInfo.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-gray-600">Eksik:</span>
                        {missingInfo.map((info, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded"
                          >
                            {info}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {action && (
                    <Link
                      to={`/manager/trips/${trip.id}`}
                      className={`mt-3 w-full py-2 px-4 rounded-lg font-medium text-center block ${action.color}`}
                    >
                      {action.label}
                    </Link>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Pending Approval Tab */}
      {tab === 'pending' && (
        <div className="space-y-3">
          {displayedTrips.length === 0 ? (
            <div className="bg-white rounded-lg p-6 text-center text-gray-600">
              <p className="mb-2">Onay bekleyen sefer bulunmuyor</p>
              <p className="text-sm text-gray-500">
                Sürücüler teslimat belgesi yüklediğinde burada görünecek
              </p>
            </div>
          ) : (
            displayedTrips.map((trip) => {
              const action = getTripActionLabel(trip, 'pending');
              return (
                <div
                  key={trip.id}
                  className="bg-white rounded-lg p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">📦</span>
                        <p className="font-bold text-gray-900">
                          {trip.originCity} → {trip.destinationCity}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600">
                        {trip.clientName || trip.driverEnteredDestination || 'Müşteri belirtilmedi'}
                      </p>
                      {trip.driverName && (
                        <p className="text-xs text-gray-500 mt-1">
                          Sürücü: {trip.driverName}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        trip.status
                      )}`}
                    >
                      {getStatusLabel(trip.status)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <span>{trip.truckPlate || 'Araç bilgisi yok'}</span>
                    {trip.deliveredAt && (
                      <span>Teslim: {formatDate(trip.deliveredAt)}</span>
                    )}
                  </div>

                  {trip.deliveryDocuments.length > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-green-600">
                        ✓ {trip.deliveryDocuments.length} belge yüklendi
                      </span>
                    </div>
                  )}

                  {action && (
                    <Link
                      to={`/manager/trips/${trip.id}`}
                      className={`mt-3 w-full py-2 px-4 rounded-lg font-medium text-center block ${action.color}`}
                    >
                      {action.label}
                    </Link>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Ready to Invoice Tab - Multi-select */}
      {tab === 'ready' && (
        <>
          <div className="space-y-3 pb-20">
            {displayedTrips.length === 0 ? (
              <div className="bg-white rounded-lg p-6 text-center text-gray-600">
                <p className="mb-2">Fatura oluşturmaya hazır sefer bulunmuyor</p>
                <p className="text-sm text-gray-500">
                  Seferler onaylandıktan sonra burada görünecek
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
                            {formatCurrency(trip.revenue || 0)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                          <span>{trip.truckPlate}</span>
                          {trip.approvedAt && (
                            <span>Onaylandı: {formatDate(trip.approvedAt)}</span>
                          )}
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
                onClick={handleGenerateInvoice}
                className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 active:bg-primary-800 transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-lg">📄</span>
                <span>Fatura Oluştur</span>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TripsPage;
