import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { truckApi, driverApi } from '../services/api';
import { useFleet } from '../contexts/FleetContext';
import { TRUCKS } from '../constants/text';
import { formatCurrency } from '../utils/format';
import ExpiryBadge from '../components/common/ExpiryBadge';
import SimpleDocumentUpdateModal from '../components/common/SimpleDocumentUpdateModal';
import type { DocumentCategory, Truck, Driver } from '../types';

const TruckDetailPage = () => {
  const { truckId } = useParams<{ truckId: string }>();
  const navigate = useNavigate();
  const { fleetId } = useFleet();
  const [truck, setTruck] = useState<Truck | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory | null>(null);
  const [uploadCurrentExpiry, setUploadCurrentExpiry] = useState<string | null>(null);
  const [showDriverSelect, setShowDriverSelect] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assigningDriver, setAssigningDriver] = useState(false);

  useEffect(() => {
    if (!truckId) return;

    const fetchTruck = async () => {
      try {
        setLoading(true);
        const data = await truckApi.getById(truckId);
        setTruck(data);
      } catch (err) {
        console.error('Error fetching truck:', err);
        setError(err instanceof Error ? err.message : 'Araç yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchTruck();
  }, [truckId]);

  useEffect(() => {
    if (!fleetId) return;

    const fetchDrivers = async () => {
      try {
        const page = await driverApi.getByFleet(0, 1000);
        setDrivers(page.content);
      } catch (err) {
        console.error('Error fetching drivers:', err);
      }
    };

    fetchDrivers();
  }, [fleetId]);

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !truck) {
    return (
      <div className="p-4">
        <p className="text-center text-red-600">{error || 'Araç bulunamadı'}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 mx-auto block px-4 py-2 bg-primary-600 text-white rounded-lg"
        >
          Geri Dön
        </button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700';
      case 'in-transit':
        return 'bg-blue-100 text-blue-700';
      case 'maintenance':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return TRUCKS.available;
      case 'in-transit':
        return TRUCKS.inTransit;
      case 'maintenance':
        return TRUCKS.maintenance;
      default:
        return status;
    }
  };

  const handleAssignDriver = async (driverId: string) => {
    if (!truckId) return;

    try {
      setAssigningDriver(true);
      const updatedTruck = await truckApi.assignDriver(truckId, driverId);
      setTruck(updatedTruck);
      setShowDriverSelect(false);
    } catch (err) {
      console.error('Error assigning driver:', err);
      alert('Sürücü atanırken hata oluştu');
    } finally {
      setAssigningDriver(false);
    }
  };

  const handleUnassignDriver = async () => {
    if (!truckId) return;

    if (!confirm('Sürücüyü kaldırmak istediğinizden emin misiniz?')) return;

    try {
      setAssigningDriver(true);
      const updatedTruck = await truckApi.unassignDriver(truckId);
      setTruck(updatedTruck);
    } catch (err) {
      console.error('Error unassigning driver:', err);
      alert('Sürücü kaldırılırken hata oluştu');
    } finally {
      setAssigningDriver(false);
    }
  };

  const handleDocumentUpdate = (category: DocumentCategory, currentExpiry: string | null) => {
    setUploadCategory(category);
    setUploadCurrentExpiry(currentExpiry);
    setUploadModalOpen(true);
  };

  const handleDocumentSave = async (category: DocumentCategory, expiryDate: string) => {
    if (!truckId) return;

    const updateData: any = {};

    if (category === 'compulsory-insurance') {
      updateData.compulsoryInsuranceExpiry = expiryDate;
    } else if (category === 'comprehensive-insurance') {
      updateData.comprehensiveInsuranceExpiry = expiryDate;
    } else if (category === 'inspection') {
      updateData.inspectionExpiry = expiryDate;
    }

    await truckApi.updateDocuments(truckId, updateData);

    // Refresh truck data
    const updatedTruck = await truckApi.getById(truckId);
    setTruck(updatedTruck);
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{truck.plateNumber}</h1>
          <p className="text-sm text-gray-600 mt-1">{truck.type}</p>
        </div>
      </div>

      {/* Basic info card */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">{TRUCKS.basicInfo}</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{TRUCKS.status}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(truck.status)}`}>
              {getStatusLabel(truck.status)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{TRUCKS.driver}</span>
            <div className="flex items-center gap-2">
              {truck.currentDriverId ? (
                <>
                  <span className="text-sm font-medium text-gray-900">
                    {truck.assignedDriverName}
                  </span>
                  <button
                    onClick={handleUnassignDriver}
                    disabled={assigningDriver}
                    className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                  >
                    Kaldır
                  </button>
                </>
              ) : (
                <>
                  {!showDriverSelect ? (
                    <button
                      onClick={() => setShowDriverSelect(true)}
                      className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                      + Sürücü Ata
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssignDriver(e.target.value);
                          }
                        }}
                        disabled={assigningDriver}
                        className="text-sm border border-gray-300 rounded px-2 py-1 disabled:opacity-50"
                        defaultValue=""
                      >
                        <option value="">Sürücü seçin</option>
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.firstName} {driver.lastName}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => setShowDriverSelect(false)}
                        className="text-xs text-gray-600 hover:text-gray-700"
                      >
                        İptal
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Document expiry section */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">{TRUCKS.documents}</h2>
        <div className="space-y-3">
          {/* Compulsory Insurance */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-900">{TRUCKS.compulsoryInsurance}</h3>
              <button
                onClick={() => handleDocumentUpdate('compulsory-insurance', truck.compulsoryInsuranceExpiry)}
                className="text-sm text-primary-600 font-medium"
              >
                Güncelle
              </button>
            </div>
            <ExpiryBadge
              label=""
              date={truck.compulsoryInsuranceExpiry}
            />
          </div>

          {/* Comprehensive Insurance */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-900">{TRUCKS.comprehensiveInsurance}</h3>
              <button
                onClick={() => handleDocumentUpdate('comprehensive-insurance', truck.comprehensiveInsuranceExpiry)}
                className="text-sm text-primary-600 font-medium"
              >
                Güncelle
              </button>
            </div>
            <ExpiryBadge
              label=""
              date={truck.comprehensiveInsuranceExpiry}
            />
          </div>

          {/* Inspection */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-900">{TRUCKS.inspection}</h3>
              <button
                onClick={() => handleDocumentUpdate('inspection', truck.inspectionExpiry)}
                className="text-sm text-primary-600 font-medium"
              >
                Güncelle
              </button>
            </div>
            <ExpiryBadge
              label=""
              date={truck.inspectionExpiry}
            />
          </div>
        </div>
      </div>

      {/* Location card */}
      {truck.lastPosition && (
        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">{TRUCKS.location}</h2>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📍</span>
            <div>
              <p className="text-sm font-medium text-gray-900">{truck.lastPosition.city}</p>
              <p className="text-xs text-gray-500">
                {truck.lastPosition.lat.toFixed(4)}, {truck.lastPosition.lng.toFixed(4)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Performance metrics */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-3">{TRUCKS.performance}</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">{TRUCKS.monthlyRevenue}</span>
            <span className="text-sm font-bold text-green-600">
              {formatCurrency(truck.monthlyRevenue)}
            </span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">{TRUCKS.tripCount}</span>
            <span className="text-sm font-bold text-gray-900">{truck.tripCount || 0}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">{TRUCKS.utilization}</span>
            <span className="text-sm font-bold text-gray-900">{truck.utilizationRate || 0}%</span>
          </div>
        </div>
      </div>

      {/* Document Update Modal */}
      {uploadModalOpen && uploadCategory && (
        <SimpleDocumentUpdateModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          category={uploadCategory}
          relatedType="truck"
          relatedId={truck.id}
          relatedName={truck.plateNumber}
          currentExpiryDate={uploadCurrentExpiry}
          onUpdate={handleDocumentSave}
        />
      )}
    </div>
  );
};

export default TruckDetailPage;
