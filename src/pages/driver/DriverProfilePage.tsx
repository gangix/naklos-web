import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { mockDrivers } from '../../data/mock';
import { PROFILE, DRIVERS, COMMON } from '../../constants/text';
import ExpiryBadge from '../../components/common/ExpiryBadge';
import { formatDate } from '../../utils/format';

const DriverProfilePage = () => {
  const { user } = useAuth();
  const { documentSubmissions } = useData();
  const [isEditing, setIsEditing] = useState(false);

  // Find current driver
  const driver = mockDrivers.find((d) => d.id === user?.driverId);

  if (!driver) {
    return (
      <div className="p-4">
        <p className="text-center text-gray-600">Sürücü bilgisi bulunamadı</p>
      </div>
    );
  }

  // Find pending submissions for this driver
  const pendingDocs = documentSubmissions.filter(
    (sub) => sub.relatedId === driver.id && sub.status === 'pending'
  );

  // Check if a document type has pending submission
  const hasPending = (category: string) => {
    return pendingDocs.some((doc) => doc.category === category);
  };

  // Get document status badge
  const getDocumentStatus = (category: string, expiryDate: string) => {
    if (hasPending(category)) {
      return (
        <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">
          Onay Bekliyor
        </span>
      );
    }
    return <ExpiryBadge label="" date={expiryDate} />;
  };

  const [editForm, setEditForm] = useState({
    phone: driver.phone,
    email: driver.email || '',
    emergencyName: driver.emergencyContact?.name || '',
    emergencyPhone: driver.emergencyContact?.phone || '',
    emergencyRelationship: driver.emergencyContact?.relationship || '',
  });

  const handleSave = () => {
    // TODO: Update driver info via DataContext
    alert('Bilgiler kaydedildi');
    setIsEditing(false);
  };

  const handleDocumentUpdate = (category: string) => {
    // TODO: Open DocumentUploadModal
    alert(`${category} belgesi güncelleme - Modal açılacak`);
  };

  return (
    <div className="p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{PROFILE.title}</h1>
        <p className="text-sm text-gray-600 mt-1">
          {driver.firstName} {driver.lastName}
        </p>
      </div>

      {/* Personal Info Card */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">{PROFILE.personalInfo}</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-primary-600 font-medium"
            >
              {COMMON.edit}
            </button>
          )}
        </div>

        <div className="space-y-3">
          {/* Full Name (read-only) */}
          <div>
            <p className="text-xs text-gray-600 mb-1">{DRIVERS.fullName}</p>
            <p className="text-sm font-medium text-gray-900">
              {driver.firstName} {driver.lastName}
            </p>
          </div>

          {/* Phone (editable) */}
          <div>
            <p className="text-xs text-gray-600 mb-1">{DRIVERS.phone}</p>
            {isEditing ? (
              <input
                type="tel"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            ) : (
              <p className="text-sm font-medium text-gray-900">{driver.phone}</p>
            )}
          </div>

          {/* Email (editable) */}
          <div>
            <p className="text-xs text-gray-600 mb-1">{DRIVERS.email}</p>
            {isEditing ? (
              <input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            ) : (
              <p className="text-sm font-medium text-gray-900">{driver.email || '-'}</p>
            )}
          </div>

          {/* License Number (read-only) */}
          <div>
            <p className="text-xs text-gray-600 mb-1">{DRIVERS.licenseNumber}</p>
            <p className="text-sm font-medium text-gray-900">{driver.licenseNumber}</p>
          </div>

          {/* License Class (read-only) */}
          <div>
            <p className="text-xs text-gray-600 mb-1">{DRIVERS.licenseClass}</p>
            <p className="text-sm font-medium text-gray-900">{driver.licenseClass}</p>
          </div>

          {isEditing && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                {COMMON.save}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                {COMMON.cancel}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Contact Card */}
      {!isEditing && driver.emergencyContact && (
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

      {/* Documents Section */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">{PROFILE.documents}</h2>

        {/* Driver's License */}
        <div className="bg-white rounded-lg p-4 shadow-sm mb-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-gray-900">{DRIVERS.license}</h3>
            <button
              onClick={() => handleDocumentUpdate('license')}
              className="text-sm text-primary-600 font-medium"
            >
              Güncelle
            </button>
          </div>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-600 mb-1">{DRIVERS.licenseNumber}</p>
              <p className="text-sm font-medium text-gray-900">{driver.licenseNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 mb-1">{DRIVERS.licenseExpiry}</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(driver.licenseExpiryDate)}</p>
            </div>
            {getDocumentStatus('license', driver.licenseExpiryDate)}
          </div>
        </div>

        {/* Certificates */}
        {driver.certificates && driver.certificates.length > 0 && (
          <>
            {driver.certificates.map((cert, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-gray-900">
                    {cert.type === 'SRC' ? DRIVERS.srcCertificate : DRIVERS.cpcCertificate}
                  </h3>
                  <button
                    onClick={() => handleDocumentUpdate(cert.type.toLowerCase())}
                    className="text-sm text-primary-600 font-medium"
                  >
                    Güncelle
                  </button>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{DRIVERS.certificateNumber}</p>
                    <p className="text-sm font-medium text-gray-900">{cert.number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{DRIVERS.issueDate}</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(cert.issueDate)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{DRIVERS.expiryDate}</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(cert.expiryDate)}</p>
                  </div>
                  {getDocumentStatus(cert.type.toLowerCase(), cert.expiryDate)}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default DriverProfilePage;
