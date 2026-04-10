import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { useFleet } from '../../contexts/FleetContext';
import { driverApi } from '../../services/api';
import { PROFILE, DRIVERS, COMMON } from '../../constants/text';
import ExpiryBadge from '../../components/common/ExpiryBadge';
import DocumentUploadModal from '../../components/common/DocumentUploadModal';
import { formatDate } from '../../utils/format';
import type { DocumentCategory } from '../../types';

const DriverProfilePage = () => {
  const { user, loginAsDriver, loginAsManager, logout } = useAuth();
  const { fleetId } = useFleet();
  const { documentSubmissions } = useData();
  const [isEditing, setIsEditing] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory | null>(null);
  const [uploadCurrentExpiry, setUploadCurrentExpiry] = useState<string | null>(null);

  // Real data from API
  const [allDrivers, setAllDrivers] = useState<any[]>([]);
  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showDriverList, setShowDriverList] = useState(false);

  // Edit form state - MUST be declared before any conditional returns
  const [editForm, setEditForm] = useState({
    phone: '',
    email: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelationship: '',
  });

  // Load all drivers for developer login
  useEffect(() => {
    if (fleetId) {
      loadDrivers();
    }
  }, [fleetId]);

  // Load current driver details (doesn't need fleetId - uses driver ID directly)
  useEffect(() => {
    if (user?.driverId) {
      loadCurrentDriver();
    } else {
      // Not logged in as driver, stop loading
      setLoading(false);
    }
  }, [user?.driverId]);

  // Update editForm when driver loads
  useEffect(() => {
    if (driver) {
      setEditForm({
        phone: driver.phone || '',
        email: driver.email || '',
        emergencyName: driver.emergencyContact?.name || '',
        emergencyPhone: driver.emergencyContact?.phone || '',
        emergencyRelationship: driver.emergencyContact?.relationship || '',
      });
    }
  }, [driver]);

  const loadDrivers = async () => {
    if (!fleetId) return;
    try {
      const page = await driverApi.getByFleet(0, 1000);
      setAllDrivers(page.content);
    } catch (error) {
      console.error('Error loading drivers:', error);
    }
  };

  const loadCurrentDriver = async () => {
    if (!user?.driverId) {
      setLoading(false);
      return;
    }

    // Validate UUID format before API call
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(user.driverId)) {
      console.warn('Invalid driver UUID in localStorage, clearing...');
      // Clear invalid localStorage data
      localStorage.removeItem('dev-auth-user');
      loginAsManager();
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await driverApi.getById(user.driverId);
      setDriver(data);
    } catch (error) {
      console.error('Error loading driver:', error);
      // If driver not found, clear and reset to manager
      localStorage.removeItem('dev-auth-user');
      loginAsManager();
    } finally {
      setLoading(false);
    }
  };

  const handleDriverSelect = (selectedDriver: any) => {
    loginAsDriver(selectedDriver.id, `${selectedDriver.firstName} ${selectedDriver.lastName}`);
    setShowDriverList(false);
    alert(`✓ ${selectedDriver.firstName} ${selectedDriver.lastName} olarak giriş yaptınız`);
  };

  const handleManagerLogin = () => {
    loginAsManager();
    setShowDriverList(false);
    alert('✓ Fleet Manager olarak giriş yaptınız');
  };

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-center text-gray-600">Yükleniyor...</p>
      </div>
    );
  }

  if (!driver && !user?.driverId) {
    return (
      <div className="p-4 pb-20">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h2 className="font-bold text-yellow-900 mb-2">⚠️ Sürücü Girişi Gerekli</h2>
          <p className="text-sm text-yellow-700 mb-3">
            Profil sayfasını görüntülemek için bir sürücü olarak giriş yapmalısınız.
          </p>
          <button
            onClick={() => setShowDriverList(true)}
            className="w-full py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Sürücü Olarak Giriş Yap
          </button>
        </div>

        {/* Developer Login Panel — only in development */}
        {showDriverList && import.meta.env.DEV && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">🔧 Geliştirici Girişi</h2>
              <p className="text-xs text-gray-600 mt-1">Test için herhangi bir sürücü olarak giriş yapın</p>
            </div>

            <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
              {allDrivers.length === 0 ? (
                <div className="text-center py-4 text-gray-600">
                  Sürücü bulunamadı. Önce sürücü ekleyin.
                </div>
              ) : (
                allDrivers.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => handleDriverSelect(d)}
                    className="w-full p-3 rounded-lg text-left transition-colors bg-gray-50 hover:bg-gray-100 border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {d.firstName} {d.lastName}
                        </p>
                        <p className="text-xs text-gray-600">{d.phone}</p>
                        <p className="text-xs text-gray-500 font-mono mt-1">ID: {d.id.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="p-4">
        <p className="text-center text-gray-600">Sürücü bilgisi bulunamadı</p>
        <button
          onClick={logout}
          className="mt-4 mx-auto block px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
        >
          Çıkış Yap
        </button>
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

  const handleSave = () => {
    // TODO: Update driver info via DataContext
    alert('Bilgiler kaydedildi');
    setIsEditing(false);
  };

  const handleDocumentUpdate = (category: DocumentCategory, currentExpiry: string) => {
    setUploadCategory(category);
    setUploadCurrentExpiry(currentExpiry);
    setUploadModalOpen(true);
  };

  return (
    <div className="p-4 pb-20">
      {/* Header with User Switcher */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{PROFILE.title}</h1>
            <p className="text-sm text-gray-600 mt-1">
              {driver.firstName} {driver.lastName}
            </p>
          </div>
          <div className="flex gap-2">
            {import.meta.env.DEV && (
              <button
                onClick={() => setShowDriverList(!showDriverList)}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showDriverList ? 'Kapat' : '🔧 Kullanıcı Değiştir'}
              </button>
            )}
            <button
              onClick={logout}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
            >
              Çıkış
            </button>
          </div>
        </div>
      </div>

      {/* Developer Login Panel — only in development */}
      {showDriverList && import.meta.env.DEV && (
        <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <h2 className="font-bold text-gray-900">🔧 Geliştirici Girişi</h2>
            <p className="text-xs text-gray-600 mt-1">Test için herhangi bir kullanıcı olarak giriş yapın</p>
          </div>

          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {/* Manager Option */}
            <button
              onClick={handleManagerLogin}
              className={`w-full p-3 rounded-lg text-left transition-colors ${
                user?.role === 'fleet-manager'
                  ? 'bg-blue-100 border-2 border-blue-600'
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Fleet Manager</p>
                  <p className="text-xs text-gray-600">Yönetici Hesabı</p>
                </div>
                {user?.role === 'fleet-manager' && (
                  <span className="text-blue-600 font-bold">✓</span>
                )}
              </div>
            </button>

            {/* Drivers List */}
            {allDrivers.length === 0 ? (
              <div className="text-center py-4 text-gray-600">
                Sürücü bulunamadı.
              </div>
            ) : (
              allDrivers.map((d) => (
                <button
                  key={d.id}
                  onClick={() => handleDriverSelect(d)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    user?.driverId === d.id
                      ? 'bg-green-100 border-2 border-green-600'
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {d.firstName} {d.lastName}
                      </p>
                      <p className="text-xs text-gray-600">{d.phone}</p>
                      <p className="text-xs text-gray-500 font-mono mt-1">ID: {d.id.substring(0, 8)}...</p>
                    </div>
                    {user?.driverId === d.id && (
                      <span className="text-green-600 font-bold">✓</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

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
              onClick={() => handleDocumentUpdate('license', driver.licenseExpiryDate)}
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
                    onClick={() => handleDocumentUpdate(cert.type.toLowerCase() as DocumentCategory, cert.expiryDate)}
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

      {/* Document Upload Modal */}
      {uploadModalOpen && uploadCategory && (
        <DocumentUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          category={uploadCategory}
          relatedType="driver"
          relatedId={driver.id}
          relatedName={`${driver.firstName} ${driver.lastName}`}
          submittedByName={`${driver.firstName} ${driver.lastName}`}
          currentExpiryDate={uploadCurrentExpiry}
          previousImageUrl={null} // TODO: Get from existing documents
        />
      )}
    </div>
  );
};

export default DriverProfilePage;
