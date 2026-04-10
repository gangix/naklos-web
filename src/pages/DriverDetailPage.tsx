import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { driverApi } from '../services/api';
import { DRIVERS } from '../constants/text';
import ExpiryBadge from '../components/common/ExpiryBadge';
import SimpleDocumentUpdateModal from '../components/common/SimpleDocumentUpdateModal';
import { formatDate } from '../utils/format';
import type { DocumentCategory, Driver } from '../types';

const DriverDetailPage = () => {
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingContact, setEditingContact] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editingEmergency, setEditingEmergency] = useState(false);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory | null>(null);
  const [uploadCurrentExpiry, setUploadCurrentExpiry] = useState<string | null>(null);
  const [showAddCertificate, setShowAddCertificate] = useState(false);
  const [certificateType, setCertificateType] = useState<'SRC' | 'CPC'>('SRC');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [certificateIssueDate, setCertificateIssueDate] = useState('');
  const [certificateExpiryDate, setCertificateExpiryDate] = useState('');

  useEffect(() => {
    if (!driverId) return;

    const fetchDriver = async () => {
      try {
        setLoading(true);
        const data = await driverApi.getById(driverId);
        setDriver(data);
      } catch (err) {
        console.error('Error fetching driver:', err);
        setError(err instanceof Error ? err.message : 'Sürücü yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchDriver();
  }, [driverId]);

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

  if (error || !driver) {
    return (
      <div className="p-4">
        <p className="text-center text-red-600">{error || 'Sürücü bulunamadı'}</p>
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

  const handleDocumentSave = async (category: DocumentCategory, expiryDate: string) => {
    if (!driverId) return;

    // Only update license expiry if a valid date is provided
    // When documents are uploaded/deleted, the expiry is automatically synced
    if (category === 'license' && expiryDate && expiryDate.trim() !== '') {
      await driverApi.updateLicense(driverId, expiryDate);
    }

    // Refresh driver data
    const updatedDriver = await driverApi.getById(driverId);
    setDriver(updatedDriver);
  };

  const handleAddCertificate = async () => {
    if (!driverId) return;

    if (!certificateNumber || !certificateIssueDate || !certificateExpiryDate) {
      alert('Lütfen tüm alanları doldurun');
      return;
    }

    // Client-side validation: check if expiry date is in the future
    const expiryDate = new Date(certificateExpiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expiryDate < today) {
      alert('❌ Hata: Geçerlilik tarihi geçmişte olamaz. Lütfen gelecekte bir tarih seçin.');
      return;
    }

    // Check if issue date is before expiry date
    const issueDate = new Date(certificateIssueDate);
    if (expiryDate < issueDate) {
      alert('❌ Hata: Geçerlilik tarihi, veriliş tarihinden önce olamaz.');
      return;
    }

    try {
      await driverApi.addCertificate(driverId, {
        type: certificateType,
        number: certificateNumber,
        issueDate: certificateIssueDate,
        expiryDate: certificateExpiryDate,
      });

      // Reset form
      setShowAddCertificate(false);
      setCertificateNumber('');
      setCertificateIssueDate('');
      setCertificateExpiryDate('');

      // Refresh driver data
      const updatedDriver = await driverApi.getById(driverId);
      setDriver(updatedDriver);

      alert('✓ Sertifika başarıyla eklendi!');
    } catch (err) {
      console.error('Error adding certificate:', err);
      const errorMessage = err instanceof Error ? err.message : 'Sertifika eklenirken hata oluştu';

      // Show user-friendly error
      if (errorMessage.includes('already expired')) {
        alert('❌ Geçmiş tarihli sertifika eklenemez. Lütfen gelecekte bir geçerlilik tarihi girin.');
      } else if (errorMessage.includes('already exists')) {
        alert('❌ Bu tipte bir sertifika zaten mevcut. Önce mevcut sertifikayı silin.');
      } else {
        alert('❌ ' + errorMessage);
      }
    }
  };

  const handleRemoveCertificate = async (certificateId: string) => {
    if (!driverId) return;

    if (!confirm('Bu sertifikayı kaldırmak istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await driverApi.removeCertificate(driverId, certificateId);

      // Refresh driver data
      const updatedDriver = await driverApi.getById(driverId);
      setDriver(updatedDriver);

      alert('✓ Sertifika başarıyla kaldırıldı!');
    } catch (err) {
      console.error('Error removing certificate:', err);
      alert('Sertifika kaldırılırken hata oluştu');
    }
  };

  const startEditContact = () => {
    setEditFirstName(driver!.firstName);
    setEditLastName(driver!.lastName);
    setEditPhone(driver!.phone);
    setEditEmail(driver!.email || '');
    setEditingContact(true);
  };

  const handleSaveContact = async () => {
    if (!driverId) return;
    try {
      setSaving(true);
      await driverApi.update(driverId, {
        firstName: editFirstName,
        lastName: editLastName,
        phone: editPhone,
        email: editEmail,
      });
      const updated = await driverApi.getById(driverId);
      setDriver(updated);
      setEditingContact(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Güncelleme sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const startEditEmergency = () => {
    setEmergencyName(driver!.emergencyContact?.name || '');
    setEmergencyPhone(driver!.emergencyContact?.phone || '');
    setEmergencyRelationship(driver!.emergencyContact?.relationship || '');
    setEditingEmergency(true);
  };

  const handleSaveEmergency = async () => {
    if (!driverId) return;
    try {
      setSaving(true);
      await driverApi.updateEmergencyContact(driverId, {
        name: emergencyName,
        phone: emergencyPhone,
        relationship: emergencyRelationship,
      });
      const updated = await driverApi.getById(driverId);
      setDriver(updated);
      setEditingEmergency(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Güncelleme sırasında hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!driverId) return;
    try {
      await driverApi.update(driverId, { status: newStatus });
      const updated = await driverApi.getById(driverId);
      setDriver(updated);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Durum güncellenirken hata oluştu');
    }
  };

  const handleDeleteDriver = async () => {
    if (!driverId) return;
    if (!confirm(`${fullName} adlı sürücüyü silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      return;
    }

    try {
      setDeleting(true);
      await driverApi.delete(driverId);
      alert('Sürücü başarıyla silindi.');
      navigate('/manager/drivers');
    } catch (err) {
      console.error('Error deleting driver:', err);
      alert(err instanceof Error ? err.message : 'Sürücü silinirken hata oluştu');
    } finally {
      setDeleting(false);
    }
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
          <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
          <select
            value={driver.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className={`mt-2 px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${getStatusColor(driver.status)}`}
          >
            <option value="AVAILABLE">Müsait</option>
            <option value="ON_TRIP">Yolda</option>
            <option value="OFF_DUTY">İzinli</option>
          </select>
        </div>
        <button
          onClick={handleDeleteDriver}
          disabled={deleting}
          className="px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {deleting ? 'Siliniyor...' : 'Sil'}
        </button>
      </div>

      {/* Contact info card */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">{DRIVERS.contactInfo}</h2>
          {!editingContact && (
            <button onClick={startEditContact} className="text-sm text-primary-600 font-medium">
              Düzenle
            </button>
          )}
        </div>
        {editingContact ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Ad</label>
              <input type="text" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Soyad</label>
              <input type="text" value={editLastName} onChange={(e) => setEditLastName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">{DRIVERS.phone}</label>
              <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">{DRIVERS.email}</label>
              <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleSaveContact} disabled={saving}
                className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-primary-700 disabled:opacity-50">
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button onClick={() => setEditingContact(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50">
                İptal
              </button>
            </div>
          </div>
        ) : (
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
        )}
      </div>

      {/* Emergency contact card */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">{DRIVERS.emergencyContact}</h2>
          {!editingEmergency && (
            <button onClick={startEditEmergency} className="text-sm text-primary-600 font-medium">
              {driver.emergencyContact ? 'Düzenle' : '+ Ekle'}
            </button>
          )}
        </div>
        {editingEmergency ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">{DRIVERS.contactName}</label>
              <input type="text" value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">{DRIVERS.contactPhone}</label>
              <input type="tel" value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">{DRIVERS.relationship}</label>
              <input type="text" value={emergencyRelationship} onChange={(e) => setEmergencyRelationship(e.target.value)}
                placeholder="Örn: Eş, Kardeş, Anne"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleSaveEmergency} disabled={saving}
                className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-primary-700 disabled:opacity-50">
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
              <button onClick={() => setEditingEmergency(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50">
                İptal
              </button>
            </div>
          </div>
        ) : driver.emergencyContact ? (
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
        ) : (
          <p className="text-sm text-gray-500">Acil durum kişisi eklenmemiş</p>
        )}
      </div>

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
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">{DRIVERS.certificates}</h2>
          <button
            onClick={() => setShowAddCertificate(true)}
            className="text-sm text-primary-600 font-medium"
          >
            + Sertifika Ekle
          </button>
        </div>

        {/* Add Certificate Form */}
        {showAddCertificate && (
          <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-4 mb-3">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Yeni Sertifika Ekle</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Sertifika Tipi *
                </label>
                <select
                  value={certificateType}
                  onChange={(e) => setCertificateType(e.target.value as 'SRC' | 'CPC')}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="SRC">SRC (Mesleki Yeterlilik Belgesi)</option>
                  <option value="CPC">CPC (Profesyonel Yeterlilik Kartı)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Sertifika Numarası *
                </label>
                <input
                  type="text"
                  value={certificateNumber}
                  onChange={(e) => setCertificateNumber(e.target.value)}
                  placeholder="Örn: SRC123456"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Veriliş Tarihi *
                </label>
                <input
                  type="date"
                  value={certificateIssueDate}
                  onChange={(e) => setCertificateIssueDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Son Geçerlilik Tarihi *
                </label>
                <input
                  type="date"
                  value={certificateExpiryDate}
                  onChange={(e) => setCertificateExpiryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ Geçerlilik tarihi bugünden ileri bir tarih olmalıdır
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleAddCertificate}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
                >
                  Ekle
                </button>
                <button
                  onClick={() => {
                    setShowAddCertificate(false);
                    setCertificateNumber('');
                    setCertificateIssueDate('');
                    setCertificateExpiryDate('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Certificates List */}
        {driver.certificates && driver.certificates.length > 0 && (
          <div className="space-y-3">
            {driver.certificates.map((cert, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-gray-900">
                    {cert.type === 'SRC' ? DRIVERS.srcCertificate : DRIVERS.cpcCertificate}
                  </h3>
                  <button
                    onClick={() => handleRemoveCertificate(cert.id)}
                    className="text-sm text-red-600 font-medium"
                  >
                    Sil
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
        )}

        {driver.certificates && driver.certificates.length === 0 && !showAddCertificate && (
          <p className="text-sm text-gray-600">Henüz sertifika eklenmemiş. Yukarıdaki butonu kullanarak sertifika ekleyebilirsiniz.</p>
        )}
      </div>

      {/* Assigned truck card */}
      {driver.assignedTruckPlate && (
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-2">{DRIVERS.assignedTruck}</h2>
          <p className="text-sm font-medium text-gray-900">{driver.assignedTruckPlate}</p>
        </div>
      )}

      {/* Document Update Modal */}
      {uploadModalOpen && uploadCategory && (
        <SimpleDocumentUpdateModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          category={uploadCategory}
          relatedType="driver"
          relatedId={driver.id}
          relatedName={fullName}
          currentExpiryDate={uploadCurrentExpiry}
          onUpdate={handleDocumentSave}
        />
      )}
    </div>
  );
};

export default DriverDetailPage;
