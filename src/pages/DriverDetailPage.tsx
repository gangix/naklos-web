import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { mockDrivers } from '../data/mock';
import { DRIVERS } from '../constants/text';
import ExpiryBadge from '../components/common/ExpiryBadge';
import DocumentUploadModal from '../components/common/DocumentUploadModal';
import { formatDate } from '../utils/format';
import type { DocumentCategory } from '../types';

const DriverDetailPage = () => {
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory | null>(null);
  const [uploadCurrentExpiry, setUploadCurrentExpiry] = useState<string | null>(null);

  const driver = mockDrivers.find((d) => d.id === driverId);

  if (!driver) {
    return (
      <div className="p-4">
        <p className="text-center text-gray-600">Sürücü bulunamadı</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700';
      case 'on-trip':
        return 'bg-blue-100 text-blue-700';
      case 'off-duty':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return DRIVERS.available;
      case 'on-trip':
        return DRIVERS.onTrip;
      case 'off-duty':
        return DRIVERS.offDuty;
      default:
        return status;
    }
  };

  const fullName = `${driver.firstName} ${driver.lastName}`;

  const handleDocumentUpdate = (category: DocumentCategory, currentExpiry: string) => {
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
          <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
            {getStatusLabel(driver.status)}
          </span>
        </div>
      </div>

      {/* Contact info card */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">{DRIVERS.contactInfo}</h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-600 mb-1">{DRIVERS.phone}</p>
            <p className="text-sm font-medium text-gray-900">{driver.phone}</p>
          </div>
          {driver.email && (
            <div>
              <p className="text-xs text-gray-600 mb-1">{DRIVERS.email}</p>
              <p className="text-sm font-medium text-gray-900">{driver.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Emergency contact card */}
      {driver.emergencyContact && (
        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">{DRIVERS.emergencyContact}</h2>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600 mb-1">{DRIVERS.contactName}</p>
              <p className="text-sm font-medium text-gray-900">{driver.emergencyContact.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">{DRIVERS.contactPhone}</p>
              <p className="text-sm font-medium text-gray-900">{driver.emergencyContact.phone}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">{DRIVERS.relationship}</p>
              <p className="text-sm font-medium text-gray-900">{driver.emergencyContact.relationship}</p>
            </div>
          </div>
        </div>
      )}

      {/* License info card */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">{DRIVERS.license}</h2>
          <button
            onClick={() => handleDocumentUpdate('license', driver.licenseExpiryDate)}
            className="text-sm text-primary-600 font-medium"
          >
            Güncelle
          </button>
        </div>
        <div className="space-y-3 mb-3">
          <div>
            <p className="text-xs text-gray-600 mb-1">{DRIVERS.licenseNumber}</p>
            <p className="text-sm font-medium text-gray-900">{driver.licenseNumber}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">{DRIVERS.licenseClass}</p>
            <p className="text-sm font-medium text-gray-900">{driver.licenseClass}</p>
          </div>
        </div>
        <ExpiryBadge
          label={DRIVERS.licenseExpiry}
          date={driver.licenseExpiryDate}
        />
      </div>

      {/* Certificates section */}
      {driver.certificates && driver.certificates.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">{DRIVERS.certificates}</h2>
          <div className="space-y-3">
            {driver.certificates.map((cert, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900">
                    {cert.type === 'SRC' ? DRIVERS.srcCertificate : DRIVERS.cpcCertificate}
                  </h3>
                  <button
                    onClick={() => handleDocumentUpdate(cert.type.toLowerCase() as DocumentCategory, cert.expiryDate)}
                    className="text-sm text-primary-600 font-medium"
                  >
                    Güncelle
                  </button>
                </div>
                <div className="space-y-2 mb-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{DRIVERS.certificateNumber}</p>
                    <p className="text-sm font-medium text-gray-900">{cert.number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{DRIVERS.issueDate}</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(cert.issueDate)}</p>
                  </div>
                </div>
                <ExpiryBadge
                  label={DRIVERS.expiryDate}
                  date={cert.expiryDate}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assigned truck card */}
      {driver.assignedTruckPlate && (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-2">{DRIVERS.assignedTruck}</h2>
          <p className="text-sm font-medium text-gray-900">{driver.assignedTruckPlate}</p>
        </div>
      )}

      {/* Document Upload Modal */}
      {uploadModalOpen && uploadCategory && (
        <DocumentUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          category={uploadCategory}
          relatedType="driver"
          relatedId={driver.id}
          relatedName={fullName}
          submittedByName="Fleet Manager"
          currentExpiryDate={uploadCurrentExpiry}
          previousImageUrl={null}
        />
      )}
    </div>
  );
};

export default DriverDetailPage;
