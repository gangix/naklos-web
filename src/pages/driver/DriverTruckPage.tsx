import { useState, useEffect } from 'react';
import { driverApi, truckApi } from '../../services/api';
import { TRUCKS } from '../../constants/text';
import ExpiryBadge from '../../components/common/ExpiryBadge';
import DocumentUploadModal from '../../components/common/DocumentUploadModal';
import type { Driver, Truck, DocumentCategory } from '../../types';

const DriverTruckPage = () => {
  const [driver, setDriver] = useState<Driver | null>(null);
  const [assignedTruck, setAssignedTruck] = useState<Truck | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory | null>(null);
  const [uploadCurrentExpiry, setUploadCurrentExpiry] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const driverData = await driverApi.getMe();
      setDriver(driverData);

      if (driverData.assignedTruckId) {
        const truck = await truckApi.getById(driverData.assignedTruckId);
        setAssignedTruck(truck as Truck);
      } else {
        setAssignedTruck(null);
      }
    } catch (error) {
      console.error('Error loading truck data:', error);
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
          <div className="text-4xl mb-3">🚛</div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Henüz araç atanmadı</h2>
          <p className="text-sm text-gray-600">
            Size bir araç atanmamış. Lütfen yöneticinizle iletişime geçin.
          </p>
        </div>
      </div>
    );
  }

  const fullName = `${driver.firstName} ${driver.lastName}`;

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

      {uploadModalOpen && uploadCategory && (
        <DocumentUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          category={uploadCategory}
          relatedType="truck"
          relatedId={assignedTruck.id}
          relatedName={assignedTruck.plateNumber}
          submittedByName={fullName}
          currentExpiryDate={uploadCurrentExpiry}
          previousImageUrl={null}
        />
      )}
    </div>
  );
};

export default DriverTruckPage;
