import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useFleet } from '../../contexts/FleetContext';
import { driverApi } from '../../services/api';
import { PROFILE, DRIVERS } from '../../constants/text';
import ExpiryBadge from '../../components/common/ExpiryBadge';
import DocumentUploadModal from '../../components/common/DocumentUploadModal';
import { formatDate } from '../../utils/format';
import type { DocumentCategory } from '../../types';

const DriverProfilePage = () => {
  const { user, loginAsDriver, loginAsManager, logout } = useAuth();
  const { fleetId } = useFleet();
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory | null>(null);
  const [uploadCurrentExpiry, setUploadCurrentExpiry] = useState<string | null>(null);

  // Real data from API
  const [allDrivers, setAllDrivers] = useState<any[]>([]);
  const [driver, setDriver] = useState<any>(null);
  const [myDocuments, setMyDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDriverList, setShowDriverList] = useState(false);


  // Dev-only: load all drivers so the "switch user" panel has options.
  // Drivers don't have permission to call /drivers, so this would 403 in
  // production — guarded behind import.meta.env.DEV.
  useEffect(() => {
    if (fleetId && import.meta.env.DEV) {
      loadDrivers();
    }
  }, [fleetId]);

  // Load current driver details — prefer /drivers/me which auto-links by email
  useEffect(() => {
    loadCurrentDriver();
  }, [user?.driverId]);

  // Load this driver's own document history
  useEffect(() => {
    if (driver) {
      loadMyDocuments();
    }
  }, [driver?.id]);

  // Note: editForm sync removed — driver self-editing is not supported yet.

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
    try {
      setLoading(true);
      // Always use /drivers/me — backend looks up by Keycloak user ID and
      // falls back to email matching to auto-link the account.
      const data = await driverApi.getMe();
      setDriver(data);
    } catch (error) {
      console.error('Error loading driver profile:', error);
      setDriver(null);
    } finally {
      setLoading(false);
    }
  };

  const loadMyDocuments = async () => {
    try {
      const docs = await driverApi.getMyDocuments();
      setMyDocuments(docs);
    } catch (err) {
      console.error('Error loading driver documents:', err);
    }
  };

  const handleDriverSelect = (selectedDriver: any) => {
    loginAsDriver(selectedDriver.id, `${selectedDriver.firstName} ${selectedDriver.lastName}`);
    setShowDriverList(false);
    toast.success(`${selectedDriver.firstName} ${selectedDriver.lastName} olarak giriş yaptınız`);
  };

  const handleManagerLogin = () => {
    loginAsManager();
    setShowDriverList(false);
    toast.success('Fleet Manager olarak giriş yaptınız');
  };

  if (loading) {
    return (
      <div className="p-4">
        <p className="text-center text-gray-600">Yükleniyor...</p>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="p-4 pb-20">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <h2 className="font-bold text-yellow-900 mb-2">⚠️ Sürücü Profili Bulunamadı</h2>
          <p className="text-sm text-yellow-700 mb-3">
            Hesabınız henüz bir sürücü kaydına bağlanmamış. Lütfen yöneticinizden sizi sürücü olarak eklemesini isteyin.
          </p>
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

  const documentTypeLabel = (type: string) => {
    switch (type) {
      case 'license': return 'Ehliyet';
      case 'src': return 'SRC Belgesi';
      case 'cpc': return 'CPC Belgesi';
      default: return type;
    }
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
        </div>

        <div className="space-y-3">
          {/* Full Name */}
          <div>
            <p className="text-xs text-gray-600 mb-1">{DRIVERS.fullName}</p>
            <p className="text-sm font-medium text-gray-900">
              {driver.firstName} {driver.lastName}
            </p>
          </div>

          {/* Phone */}
          <div>
            <p className="text-xs text-gray-600 mb-1">{DRIVERS.phone}</p>
            <p className="text-sm font-medium text-gray-900">{driver.phone}</p>
          </div>

          {/* Email */}
          <div>
            <p className="text-xs text-gray-600 mb-1">{DRIVERS.email}</p>
            <p className="text-sm font-medium text-gray-900">{driver.email || '-'}</p>
          </div>

          {/* License Number */}
          <div>
            <p className="text-xs text-gray-600 mb-1">{DRIVERS.licenseNumber}</p>
            <p className="text-sm font-medium text-gray-900">{driver.licenseNumber}</p>
          </div>

          {/* License Class */}
          <div>
            <p className="text-xs text-gray-600 mb-1">{DRIVERS.licenseClass}</p>
            <p className="text-sm font-medium text-gray-900">{driver.licenseClass}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 mt-2">
            <p className="text-xs text-blue-700">
              İletişim bilgilerinizi değiştirmek için yöneticinize başvurun
            </p>
          </div>
        </div>
      </div>

      {/* Emergency Contact Card */}
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
            <ExpiryBadge label="" date={driver.licenseExpiryDate} />
          </div>
        </div>

        {/* SRC Certificate */}
        {(() => {
          const srcCert = driver.certificates?.find((c: any) => c.type === 'SRC');
          return (
            <div className="bg-white rounded-lg p-4 shadow-sm mb-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-900">{DRIVERS.srcCertificate}</h3>
                <button
                  onClick={() => handleDocumentUpdate('src', srcCert?.expiryDate || null)}
                  className="text-sm text-primary-600 font-medium"
                >
                  {srcCert ? 'Güncelle' : 'Yükle'}
                </button>
              </div>
              {srcCert ? (
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{DRIVERS.certificateNumber}</p>
                    <p className="text-sm font-medium text-gray-900">{srcCert.number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{DRIVERS.expiryDate}</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(srcCert.expiryDate)}</p>
                  </div>
                  <ExpiryBadge label="" date={srcCert.expiryDate} />
                </div>
              ) : (
                <p className="text-sm text-gray-500">Henüz yüklenmemiş</p>
              )}
            </div>
          );
        })()}

        {/* CPC Certificate */}
        {(() => {
          const cpcCert = driver.certificates?.find((c: any) => c.type === 'CPC');
          return (
            <div className="bg-white rounded-lg p-4 shadow-sm mb-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-900">{DRIVERS.cpcCertificate}</h3>
                <button
                  onClick={() => handleDocumentUpdate('cpc', cpcCert?.expiryDate || null)}
                  className="text-sm text-primary-600 font-medium"
                >
                  {cpcCert ? 'Güncelle' : 'Yükle'}
                </button>
              </div>
              {cpcCert ? (
                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{DRIVERS.certificateNumber}</p>
                    <p className="text-sm font-medium text-gray-900">{cpcCert.number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{DRIVERS.expiryDate}</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(cpcCert.expiryDate)}</p>
                  </div>
                  <ExpiryBadge label="" date={cpcCert.expiryDate} />
                </div>
              ) : (
                <p className="text-sm text-gray-500">Henüz yüklenmemiş</p>
              )}
            </div>
          );
        })()}
      </div>

      {/* Upload history */}
      {myDocuments.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Belge Geçmişi</h2>
          <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-100">
            {myDocuments.map((doc) => (
              <div key={doc.id} className="p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    {documentTypeLabel(doc.documentType)}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(doc.uploadedAt)}</p>
                </div>
                <p className="text-xs text-gray-600 mt-1 truncate">{doc.fileName}</p>
                {doc.expiryDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Geçerlilik: {formatDate(doc.expiryDate)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document Upload Modal */}
      {uploadModalOpen && uploadCategory && (
        <DocumentUploadModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          category={uploadCategory}
          relatedType="driver"
          currentExpiryDate={uploadCurrentExpiry}
          onUploadSuccess={() => {
            loadCurrentDriver();
            loadMyDocuments();
          }}
        />
      )}
    </div>
  );
};

export default DriverProfilePage;
