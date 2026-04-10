import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { driverApi, truckApi } from '../../services/api';
import { TRUCK_REQUEST, TRUCKS, COMMON } from '../../constants/text';
import ExpiryBadge from '../../components/common/ExpiryBadge';
import DocumentUploadModal from '../../components/common/DocumentUploadModal';
import type { Driver, Truck, DocumentCategory } from '../../types';

const DriverTruckPage = () => {
  const { user } = useAuth();
  const { truckAssignmentRequests, requestTruckAssignment } = useData();
  const [showTruckSelector, setShowTruckSelector] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory | null>(null);
  const [uploadCurrentExpiry, setUploadCurrentExpiry] = useState<string | null>(null);
  const [driver, setDriver] = useState<Driver | null>(null);
  const [assignedTruck, setAssignedTruck] = useState<Truck | null>(null);
  const [availableTrucks, setAvailableTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user?.driverId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const driverData = await driverApi.getMe();
      setDriver(driverData);

      if (driverData.assignedTruckId) {
        const truck = await truckApi.getById(driverData.assignedTruckId);
        setAssignedTruck(truck as Truck);
      }

      const trucks = await truckApi.getAvailable();
      setAvailableTrucks((trucks as Truck[]).filter((t) => !t.assignedDriverId));
    } catch (error) {
      console.error('Error loading truck data:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="p-4">
        <p className="text-center text-gray-600">Sürücü bilgisi bulunamadı</p>
      </div>
    );
  }

  // Find pending truck request for this driver
  const pendingRequest = truckAssignmentRequests.find(
    (req) => req.driverId === driver.id && req.status === 'pending'
  );

  const handleTruckRequest = (truckId: string, truckPlate: string) => {
    if (!driver) return;

    requestTruckAssignment({
      driverId: driver.id,
      driverName: `${driver.firstName} ${driver.lastName}`,
      preferredTruckId: truckId,
      preferredTruckPlate: truckPlate,
      rejectionNote: null,
    });

    setShowTruckSelector(false);
    alert('Araç talebi gönderildi. Yöneticiniz inceleyecek.');
  };

  const handleDocumentUpdate = (category: DocumentCategory, currentExpiry: string | null) => {
    setUploadCategory(category);
    setUploadCurrentExpiry(currentExpiry);
    setUploadModalOpen(true);
  };

  // If truck assigned, show truck details
  if (assignedTruck) {
    return (
      <div className="p-4 pb-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{TRUCK_REQUEST.title}</h1>

        {/* Truck Info Card */}
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
            <div>
              <p className="text-xs text-gray-600 mb-1">{TRUCKS.status}</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                assignedTruck.status === 'available'
                  ? 'bg-green-100 text-green-700'
                  : assignedTruck.status === 'in-transit'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {assignedTruck.status === 'available' ? TRUCKS.available :
                 assignedTruck.status === 'in-transit' ? TRUCKS.inTransit :
                 TRUCKS.maintenance}
              </span>
            </div>
          </div>
        </div>

        {/* Truck Documents */}
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">{TRUCKS.documents}</h2>

          {assignedTruck.compulsoryInsuranceExpiry && (
            <div className="bg-white rounded-lg p-4 shadow-sm mb-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-900">{TRUCKS.compulsoryInsurance}</h3>
                <button
                  onClick={() => handleDocumentUpdate('compulsory-insurance', assignedTruck.compulsoryInsuranceExpiry)}
                  className="text-sm text-primary-600 font-medium"
                >
                  Güncelle
                </button>
              </div>
              <ExpiryBadge label={TRUCKS.expiryDate} date={assignedTruck.compulsoryInsuranceExpiry} />
            </div>
          )}

          {assignedTruck.comprehensiveInsuranceExpiry && (
            <div className="bg-white rounded-lg p-4 shadow-sm mb-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-900">{TRUCKS.comprehensiveInsurance}</h3>
                <button
                  onClick={() => handleDocumentUpdate('comprehensive-insurance', assignedTruck.comprehensiveInsuranceExpiry)}
                  className="text-sm text-primary-600 font-medium"
                >
                  Güncelle
                </button>
              </div>
              <ExpiryBadge label={TRUCKS.expiryDate} date={assignedTruck.comprehensiveInsuranceExpiry} />
            </div>
          )}

          {assignedTruck.inspectionExpiry && (
            <div className="bg-white rounded-lg p-4 shadow-sm mb-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-900">{TRUCKS.inspection}</h3>
                <button
                  onClick={() => handleDocumentUpdate('inspection', assignedTruck.inspectionExpiry)}
                  className="text-sm text-primary-600 font-medium"
                >
                  Güncelle
                </button>
              </div>
              <ExpiryBadge label={TRUCKS.expiryDate} date={assignedTruck.inspectionExpiry} />
            </div>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            ℹ️ Araç belgelerini güncelleyebilirsiniz. Yüklediğiniz belgeler yöneticiniz tarafından onaylandıktan sonra geçerli olacak.
          </p>
        </div>

        {uploadModalOpen && uploadCategory && assignedTruck && (
          <DocumentUploadModal
            isOpen={uploadModalOpen}
            onClose={() => setUploadModalOpen(false)}
            category={uploadCategory}
            relatedType="truck"
            relatedId={assignedTruck.id}
            relatedName={assignedTruck.plateNumber}
            submittedByName={`${driver.firstName} ${driver.lastName}`}
            currentExpiryDate={uploadCurrentExpiry}
            previousImageUrl={null}
          />
        )}
      </div>
    );
  }

  // If pending request exists
  if (pendingRequest) {
    return (
      <div className="p-4 pb-20">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{TRUCK_REQUEST.title}</h1>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">⏳</span>
            <h3 className="text-lg font-bold text-yellow-900">{TRUCK_REQUEST.pending}</h3>
          </div>
          <p className="text-sm text-yellow-800 mb-3">
            Araç talebiniz yöneticiniz tarafından inceleniyor.
          </p>
          <div className="bg-white rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">{TRUCK_REQUEST.preferredTruck}</p>
            <p className="text-sm font-bold text-gray-900">{pendingRequest.preferredTruckPlate}</p>
          </div>
        </div>
      </div>
    );
  }

  // If no truck assigned and no pending request - show request button
  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{TRUCK_REQUEST.title}</h1>

      {!showTruckSelector ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-6xl mb-4">🚛</div>
          <p className="text-lg font-medium text-gray-900 mb-2">{TRUCK_REQUEST.noTruckAssigned}</p>
          <p className="text-sm text-gray-600 text-center mb-6">
            Müsait araçlardan birini talep edebilirsiniz.
          </p>
          <button
            onClick={() => setShowTruckSelector(true)}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            {TRUCK_REQUEST.requestTruck}
          </button>
        </div>
      ) : (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">{TRUCK_REQUEST.availableTrucks}</h2>
            <button
              onClick={() => setShowTruckSelector(false)}
              className="text-sm text-gray-600"
            >
              {COMMON.cancel}
            </button>
          </div>

          {availableTrucks.length === 0 ? (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-sm text-gray-600">{TRUCK_REQUEST.noAvailable}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableTrucks.map((truck) => (
                <button
                  key={truck.id}
                  onClick={() => handleTruckRequest(truck.id, truck.plateNumber)}
                  className="w-full bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow text-left border-2 border-transparent hover:border-primary-500"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900">{truck.plateNumber}</p>
                      <p className="text-sm text-gray-600 mt-1">{truck.type}</p>
                    </div>
                    <span className="text-primary-600 text-xl">→</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DriverTruckPage;
