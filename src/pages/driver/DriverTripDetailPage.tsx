import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useFleet } from '../../contexts/FleetContext';
import { tripApi, truckApi } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/format';
import FileUpload from '../../components/common/FileUpload';
import type { Document } from '../../types';

const DriverTripDetailPage = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { fleetId } = useFleet();
  const { trips, updateTrip } = useData();
  const { user } = useAuth();

  const trip = trips.find((t) => t.id === tripId);
  const [documents, setDocuments] = useState<Document[]>(trip?.deliveryDocuments || []);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showTruckSelection, setShowTruckSelection] = useState(false);
  const [selectedTruckId, setSelectedTruckId] = useState<string>('');

  // Real data from APIs
  const [trucks, setTrucks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load trucks from API
  useEffect(() => {
    if (fleetId) {
      loadTrucks();
    }
  }, [fleetId]);

  const loadTrucks = async () => {
    if (!fleetId) return;
    try {
      setLoading(true);
      const trucksData = await truckApi.getAvailable(fleetId);
      setTrucks(trucksData);
    } catch (error) {
      console.error('Error loading trucks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sync with context when trip changes
  useEffect(() => {
    if (trip) {
      setDocuments(trip.deliveryDocuments);
    }
  }, [trip]);

  if (!trip) {
    return (
      <div className="p-4">
        <p className="text-center text-gray-600">Sefer bulunamadı</p>
      </div>
    );
  }

  const isMyTrip = trip.driverId === user?.driverId;
  const canAssign = trip.status === 'created' && !trip.driverId;
  const canUnassign = isMyTrip && (trip.status === 'created' || trip.status === 'in-progress');
  const canUploadPOD = isMyTrip && trip.status === 'in-progress';

  const getStatusColor = (status: string) => {
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'created':
        return 'Atanmadı';
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

  const totalExpenses =
    (trip.expenses?.fuel?.amount || 0) +
    (trip.expenses?.tolls?.amount || 0) +
    (trip.expenses?.other?.amount || 0);

  const handleAssignToSelf = async () => {
    if (!selectedTruckId) {
      alert('⚠️ Lütfen bir araç seçin');
      return;
    }

    const selectedTruck = trucks.find((t) => t.id === selectedTruckId);
    if (!selectedTruck) return;

    try {
      // Call backend API to assign driver and truck
      await tripApi.assignDriverAndTruck(trip.id, {
        driverId: user?.driverId || '',
        truckId: selectedTruck.id,
      });

      // Mark trip as in progress
      await tripApi.markInProgress(trip.id);

      // Update local state
      await updateTrip(trip.id, {
        driverId: user?.driverId || null,
        driverName: user?.name || null,
        truckId: selectedTruck.id,
        truckPlate: selectedTruck.plateNumber,
        status: 'in-progress',
      });

      setShowTruckSelection(false);
      alert('✓ Sefer size atandı!');
    } catch (error: any) {
      console.error('Error assigning trip:', error);
      alert('❌ Hata: ' + (error.message || 'Sefer atanırken hata oluştu'));
    }
  };

  const handleUnassign = async () => {
    const confirmed = window.confirm(
      'Bu seferden ayrılmak istediğinizden emin misiniz?\n\nSefer yeniden müsait seferler listesine eklenecek.'
    );

    if (confirmed) {
      try {
        // Cancel the trip on backend
        await tripApi.cancelTrip(trip.id, 'Driver unassigned from trip');

        // Update local state
        await updateTrip(trip.id, {
          driverId: null,
          driverName: null,
          truckId: null,
          truckPlate: null,
          status: 'created',
        });

        alert('✓ Seferden ayrıldınız');
        navigate('/driver/trips');
      } catch (error: any) {
        console.error('Error unassigning from trip:', error);
        alert('❌ Hata: ' + (error.message || 'Seferden ayrılırken hata oluştu'));
      }
    }
  };

  const handleFileSelect = (document: Document) => {
    if (documents.length >= 3) {
      alert('En fazla 3 belge yükleyebilirsiniz');
      return;
    }
    setDocuments([...documents, document]);
  };

  const handleUploadPOD = async () => {
    if (documents.length === 0) {
      alert('⚠️ Lütfen en az 1 teslimat belgesi yükleyin');
      return;
    }

    const confirmed = window.confirm(
      `Teslimat belgelerini onaylamak istediğinizden emin misiniz?\n\n${documents.length} belge yüklenecek.\n\nOnaylandıktan sonra yöneticiniz seferi inceleyecek.`
    );

    if (confirmed) {
      try {
        // Call backend API to mark as delivered
        await tripApi.markDelivered(trip.id, {
          deliveryLocation: trip.destinationCity,
          deliveryNotes: 'POD documents uploaded by driver',
        });

        // Update local state
        await updateTrip(trip.id, {
          status: 'delivered',
          deliveredAt: new Date().toISOString(),
          deliveryDocuments: documents,
        });

        alert('✓ Teslimat belgeleri gönderildi!');
        navigate('/driver');
      } catch (error: any) {
        console.error('Error uploading POD:', error);
        alert('❌ Hata: ' + (error.message || 'Teslimat belgeleri yüklenirken hata oluştu'));
      }
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

      {/* Assign to Self Button */}
      {canAssign && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-4">
          <h2 className="text-lg font-bold text-blue-900 mb-2">Müsait Sefer</h2>
          <p className="text-sm text-blue-700 mb-3">
            Bu seferi alıp başlatabilirsiniz.
          </p>
          {!showTruckSelection ? (
            <button
              onClick={() => setShowTruckSelection(true)}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              🚛 Seferi Al
            </button>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-blue-900 block mb-2">
                  Araç Seçin:
                </label>
                <select
                  value={selectedTruckId}
                  onChange={(e) => setSelectedTruckId(e.target.value)}
                  className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                >
                  <option value="">Araç seçin...</option>
                  {trucks
                    .filter((truck) => truck.status === 'available')
                    .map((truck) => (
                      <option key={truck.id} value={truck.id}>
                        {truck.plateNumber} - {truck.type}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAssignToSelf}
                  disabled={!selectedTruckId}
                  className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                    selectedTruckId
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  ✓ Onayla
                </button>
                <button
                  onClick={() => {
                    setShowTruckSelection(false);
                    setSelectedTruckId('');
                  }}
                  className="flex-1 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                >
                  ✕ İptal
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Unassign Button */}
      {canUnassign && (
        <div className="mb-4">
          <button
            onClick={handleUnassign}
            className="w-full py-2 px-4 bg-red-100 text-red-700 border border-red-300 rounded-lg font-medium hover:bg-red-200 transition-colors"
          >
            🚫 Seferden Ayrıl
          </button>
        </div>
      )}

      {/* Trip info card */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Sefer Bilgileri</h2>
        <div className="space-y-3">
          {/* Client */}
          <div>
            <label className="text-sm text-gray-600 block mb-1">Müşteri</label>
            <span className="text-sm font-medium text-gray-900">{trip.clientName || 'Belirtilmemiş'}</span>
          </div>

          {/* Truck */}
          <div>
            <label className="text-sm text-gray-600 block mb-1">Araç</label>
            <span className="text-sm font-medium text-gray-900">{trip.truckPlate || 'Belirtilmemiş'}</span>
          </div>

          {/* Driver */}
          <div>
            <label className="text-sm text-gray-600 block mb-1">Sürücü</label>
            <span className="text-sm font-medium text-gray-900">{trip.driverName || 'Belirtilmemiş'}</span>
          </div>

          {/* Cargo Description */}
          <div>
            <label className="text-sm text-gray-600 block mb-1">Kargo Tanımı</label>
            <span className="text-sm font-medium text-gray-900">{trip.cargoDescription || 'Belirtilmemiş'}</span>
          </div>

          {/* Driver Entered Destination (if POD-first trip) */}
          {trip.driverEnteredDestination && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-xs text-orange-700 mb-1">Girdiğiniz Hedef:</p>
              <p className="text-sm font-medium text-orange-900">{trip.driverEnteredDestination}</p>
            </div>
          )}
        </div>
      </div>

      {/* Expenses (driver can see expenses only, not revenue/profit) */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Giderler</h2>
        <div className="space-y-2">
          {/* Fuel */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600">Yakıt</label>
            <span className="text-sm text-gray-900">{formatCurrency(trip.expenses?.fuel?.amount || 0)}</span>
          </div>

          {/* Tolls */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600">Geçiş Ücretleri</label>
            <span className="text-sm text-gray-900">{formatCurrency(trip.expenses?.tolls?.amount || 0)}</span>
          </div>

          {/* Other */}
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-600">Diğer</label>
            <span className="text-sm text-gray-900">{formatCurrency(trip.expenses?.other?.amount || 0)}</span>
          </div>

          {/* Other Reason */}
          {(trip.expenses?.other?.amount || 0) > 0 && trip.expenses?.otherReason && (
            <div className="mt-2 pl-3">
              <label className="text-xs text-gray-600 block mb-1">Açıklama:</label>
              <span className="text-sm text-gray-700">{trip.expenses.otherReason}</span>
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-900">Toplam Gider</span>
            <span className="text-sm font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Zaman Çizelgesi</h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-600 mb-1">Oluşturuldu</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(trip.createdAt)}</p>
          </div>
          {trip.deliveredAt && (
            <div>
              <p className="text-xs text-gray-600 mb-1">Teslim Edildi</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(trip.deliveredAt)}</p>
            </div>
          )}
          {trip.approvedAt && (
            <div>
              <p className="text-xs text-gray-600 mb-1">Onaylandı</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(trip.approvedAt)}</p>
            </div>
          )}
          {!trip.deliveredAt && trip.estimatedArrival && (
            <div>
              <p className="text-xs text-gray-600 mb-1">Tahmini Varış</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(trip.estimatedArrival)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delivery documents section */}
      {trip.status !== 'created' && (
        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Teslimat Belgeleri</h2>

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

          {/* Upload button - only show if in-progress and can upload */}
          {canUploadPOD && documents.length < 3 && (
            <FileUpload onFileSelect={handleFileSelect} />
          )}

          {documents.length >= 3 && canUploadPOD && (
            <p className="text-xs text-center text-gray-500 mt-3">
              En fazla 3 belge yükleyebilirsiniz
            </p>
          )}
        </div>
      )}

      {/* Upload POD Button */}
      {canUploadPOD && documents.length > 0 && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
          <h2 className="text-lg font-bold text-green-900 mb-2">Teslimat Tamamlandı mı?</h2>
          <p className="text-sm text-green-700 mb-3">
            Belgeleri yüklediyseniz, teslimatı onaylayın.
          </p>
          <button
            onClick={handleUploadPOD}
            className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-lg">✓</span>
            <span>Teslimatı Onayla</span>
          </button>
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

export default DriverTripDetailPage;
