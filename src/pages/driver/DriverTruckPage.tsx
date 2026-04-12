import { useState, useEffect } from 'react';
import { Truck as TruckIcon } from 'lucide-react';
import { driverApi, truckApi } from '../../services/api';
import { TRUCKS } from '../../constants/text';
import { formatRelativeTime } from '../../utils/format';
import ExpiryBadge from '../../components/common/ExpiryBadge';
import DocumentUploadModal from '../../components/common/DocumentUploadModal';
import { useLocationSharing } from '../../contexts/LocationSharingContext';
import type { Driver, Truck, DocumentCategory } from '../../types';

const DriverTruckPage = () => {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [assignedTruck, setAssignedTruck] = useState<Truck | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory | null>(null);
  const [uploadCurrentExpiry, setUploadCurrentExpiry] = useState<string | null>(null);
  const locationSharing = useLocationSharing();

  useEffect(() => {
    loadData();
  }, []);

  const reloadTruck = async () => {
    // Drivers can't call /trucks/{id} (manager-only); use /trucks/my-truck.
    try {
      const truck = await truckApi.getMyTruck();
      setAssignedTruck(truck as Truck);
    } catch (truckErr) {
      console.error('Error loading assigned truck:', truckErr);
      setAssignedTruck(null);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const driverData = await driverApi.getMe();
      setDriver(driverData);

      if (driverData.assignedTruckId) {
        await reloadTruck();
      } else {
        setAssignedTruck(null);
      }
    } catch (error) {
      console.error('Error loading driver profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpdate = (category: DocumentCategory, currentExpiry: string | null) => {
    setUploadCategory(category);
    setUploadCurrentExpiry(currentExpiry);
    setUploadModalOpen(true);
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="p-4 pb-20">
        <p className="text-center text-gray-600 py-12">Sürücü bilgisi bulunamadı</p>
      </div>
    );
  }

  if (!assignedTruck) {
    return (
      <div className="p-4 pb-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Aracım</h1>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <TruckIcon className="w-10 h-10 text-blue-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Henüz araç atanmadı</h2>
          <p className="text-sm text-gray-600">
            Size bir araç atanmamış. Lütfen yöneticinizle iletişime geçin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Aracım</h1>

      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">{TRUCKS.basicInfo}</h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-600 mb-1">{TRUCKS.plateNumber}</p>
            <p className="text-lg font-bold text-gray-900">{assignedTruck.plateNumber}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">{TRUCKS.type}</p>
            <p className="text-sm font-medium text-gray-900">{assignedTruck.type}</p>
          </div>
        </div>
      </div>

      {/* Location status (controls are in bottom nav) */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-gray-900">Konum Durumu</h2>
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
            locationSharing.enabled
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              locationSharing.enabled ? 'bg-green-500' : 'bg-gray-400'
            }`} />
            {locationSharing.enabled ? 'Otomatik paylaşım açık' : 'Kapalı'}
          </span>
        </div>
        {(locationSharing.lastCity || assignedTruck.lastPosition) && (
          <div>
            <p className="text-sm text-gray-900">
              Son konum: <span className="font-medium">
                {locationSharing.lastCity || assignedTruck.lastPosition?.city}
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {locationSharing.lastUpdatedAt
                ? formatRelativeTime(locationSharing.lastUpdatedAt)
                : assignedTruck.lastPosition?.updatedAt
                  ? formatRelativeTime(assignedTruck.lastPosition.updatedAt)
                  : ''}
            </p>
          </div>
        )}
        {!locationSharing.enabled && !assignedTruck.lastPosition && (
          <p className="text-sm text-gray-500">
            Alt menüden konum paylaşımını açabilirsiniz
          </p>
        )}
        {locationSharing.error && (
          <p className="text-xs text-orange-600 mt-2">{locationSharing.error}</p>
        )}
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">{TRUCKS.documents}</h2>

        <div className="bg-white rounded-lg p-4 shadow-sm mb-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-900">{TRUCKS.compulsoryInsurance}</h3>
            <button
              onClick={() => handleDocumentUpdate('compulsory-insurance', assignedTruck.compulsoryInsuranceExpiry)}
              className="text-sm text-primary-600 font-medium"
            >
              {assignedTruck.compulsoryInsuranceExpiry ? 'Güncelle' : 'Yükle'}
            </button>
          </div>
          <ExpiryBadge label={TRUCKS.expiryDate} date={assignedTruck.compulsoryInsuranceExpiry} />
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm mb-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-900">{TRUCKS.comprehensiveInsurance}</h3>
            <button
              onClick={() => handleDocumentUpdate('comprehensive-insurance', assignedTruck.comprehensiveInsuranceExpiry)}
              className="text-sm text-primary-600 font-medium"
            >
              {assignedTruck.comprehensiveInsuranceExpiry ? 'Güncelle' : 'Yükle'}
            </button>
          </div>
          <ExpiryBadge label={TRUCKS.expiryDate} date={assignedTruck.comprehensiveInsuranceExpiry} />
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm mb-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-900">{TRUCKS.inspection}</h3>
            <button
              onClick={() => handleDocumentUpdate('inspection', assignedTruck.inspectionExpiry)}
              className="text-sm text-primary-600 font-medium"
            >
              {assignedTruck.inspectionExpiry ? 'Güncelle' : 'Yükle'}
            </button>
          </div>
          <ExpiryBadge label={TRUCKS.expiryDate} date={assignedTruck.inspectionExpiry} />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          ℹ️ Yüklediğiniz araç belgeleri anında sisteme kaydedilir ve yöneticiniz tarafından görüntülenebilir.
        </p>
      </div>

      {uploadModalOpen && uploadCategory && (
        <DocumentUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          category={uploadCategory}
          relatedType="truck"
          currentExpiryDate={uploadCurrentExpiry}
          onUploadSuccess={reloadTruck}
        />
      )}
    </div>
  );
};

export default DriverTruckPage;
