import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockTrucks } from '../data/mock';
import { TRUCKS } from '../constants/text';
import { formatCurrency } from '../utils/format';
import ExpiryBadge from '../components/common/ExpiryBadge';
import DocumentUploadModal from '../components/common/DocumentUploadModal';
import type { DocumentCategory } from '../types';

const TruckDetailPage = () => {
  const { truckId } = useParams<{ truckId: string }>();
  const navigate = useNavigate();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory | null>(null);
  const [uploadCurrentExpiry, setUploadCurrentExpiry] = useState<string | null>(null);

  const truck = mockTrucks.find((t) => t.id === truckId);

  if (!truck) {
    return (
      <div className="p-4">
        <p className="text-center text-gray-600">Araç bulunamadı</p>
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

  const handleDocumentUpdate = (category: DocumentCategory, currentExpiry: string | null) => {
    setUploadCategory(category);
    setUploadCurrentExpiry(currentExpiry);
    setUploadModalOpen(true);
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
            <span className="text-sm font-medium text-gray-900">
              {truck.assignedDriverName || 'Atanmadı'}
            </span>
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
            <span className="text-sm font-bold text-gray-900">{truck.tripCount}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-600">{TRUCKS.utilization}</span>
            <span className="text-sm font-bold text-gray-900">{truck.utilizationRate}%</span>
          </div>
        </div>
      </div>

      {/* Document Upload Modal */}
      {uploadModalOpen && uploadCategory && (
        <DocumentUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          category={uploadCategory}
          relatedType="truck"
          relatedId={truck.id}
          relatedName={truck.plateNumber}
          submittedByName="Fleet Manager"
          currentExpiryDate={uploadCurrentExpiry}
          previousImageUrl={null}
        />
      )}
    </div>
  );
};

export default TruckDetailPage;
