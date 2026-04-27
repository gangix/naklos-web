import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { driverApi } from '../services/api';
import { useTranslation } from 'react-i18next';
import ExpiryBadge from '../components/common/ExpiryBadge';
import SimpleDocumentUpdateModal from '../components/common/SimpleDocumentUpdateModal';
import ConfirmActionModal from '../components/fuel/ConfirmActionModal';
import { FileInput, Select, TextInput } from '../components/common/FormField';
import { ArrowLeft, ChevronRight, Mail, RefreshCw } from 'lucide-react';
import { formatDate } from '../utils/format';
import { deriveDriverStatus, STATUS_BADGE } from '../utils/derivedStatus';
import { computeDriverWarnings, DRIVER_DOC_LABEL_KEYS } from '../utils/driverWarnings';
import { useFleetRoster } from '../contexts/FleetRosterContext';
import Avatar from '../components/common/Avatar';
import EntityWarningsRollup from '../components/common/EntityWarningsRollup';
import TabSeverityBadge from '../components/common/TabSeverityBadge';
import { pushRecent } from '../utils/recentEntities';
import type { DocumentCategory, Driver } from '../types';
import type { EntityWarning } from '../types/entityWarning';
import { worstSeverity } from '../utils/severity';
import { daysUntil, WARN_THRESHOLD_DAYS } from '../utils/expiry';

type Tab = 'genel' | 'belgeler';

const DriverDetailPage = () => {
  const { t } = useTranslation();
  const { driverId } = useParams<{ driverId: string }>();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
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
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  // Separate the two delete confirm paths so they can't collide. Earlier
  // they shared `confirmAction === 'delete'` + a secondary `pendingCertificateId`
  // field — a missed reset anywhere could delete the wrong target.
  const [certDeleteId, setCertDeleteId] = useState<string | null>(null);
  const [driverDeleteOpen, setDriverDeleteOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('genel');
  const [tabAutoPicked, setTabAutoPicked] = useState(false);
  const { refresh: refreshRoster } = useFleetRoster();

  useEffect(() => {
    if (!driverId) return;

    const fetchDriver = async () => {
      try {
        setLoading(true);
        const data = await driverApi.getById(driverId);
        setDriver(data);
      } catch (err) {
        console.error('Error fetching driver:', err);
        setError(err instanceof Error ? err.message : t('driverDetail.loadError'));
      } finally {
        setLoading(false);
      }
    };

    const fetchDocuments = async () => {
      try {
        const docs = await driverApi.getDocuments(driverId);
        setDocuments(docs as any[]);
      } catch (err) {
        console.error('Error fetching driver documents:', err);
      }
    };

    fetchDriver();
    fetchDocuments();
  }, [driverId]);

  const documentTypeLabel = (type: string) => {
    switch (type) {
      case 'license': return t('driver.license');
      case 'src': return t('driver.srcCertificate');
      case 'cpc': return t('driver.cpcCertificate');
      default: return type;
    }
  };

  const driverWarnings = useMemo(() => (driver ? computeDriverWarnings(driver) : []), [driver]);

  const driverEntityWarnings = useMemo<EntityWarning[]>(() => {
    if (!driver) return [];
    const warnings: EntityWarning[] = [];

    // Doc warnings sourced from canonical `computeDriverWarnings` so the
    // Belgeler tab badge, dashboard rollup, and sidebar count agree on
    // mandatoriness (only `license` is mandatory; SRC missing is canonical
    // CRITICAL but treated as `isMandatory: true` only for license here so
    // tone/labelling matches the legacy detail-page behavior).
    for (const w of driverWarnings) {
      warnings.push({
        kind: 'doc',
        severity: w.severity,
        labelKey: DRIVER_DOC_LABEL_KEYS[w.type],
        daysLeft: w.daysLeft,
        isMandatory: w.type === 'license',
      });
    }

    return warnings;
  }, [driver, driverWarnings]);

  // Record a "recent visit" so the ⌘K palette can surface this driver.
  useEffect(() => {
    if (!driver) return;
    pushRecent({
      type: 'driver',
      id: driver.id,
      label: `${driver.firstName} ${driver.lastName}`,
      sublabel: driver.assignedTruckPlate ?? '',
    });
  }, [driver]);

  // When a manager clicks through from a "needs attention" context, default
  // to the Belgeler tab so they don't have to pivot after landing. Once the
  // user actively switches tabs, stop overriding. Mirrors TruckDetailPage.
  useEffect(() => {
    if (!driver || tabAutoPicked) return;
    setTabAutoPicked(true);
    if (driverWarnings.length > 0) setActiveTab('belgeler');
  }, [driver, tabAutoPicked, driverWarnings.length]);

  if (loading) {
    return (
      <div >
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div >
        <p className="text-center text-red-600">{error || t('driverDetail.notFound')}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 mx-auto block px-4 py-2 bg-primary-600 text-white rounded-lg"
        >
          {t('common.back')}
        </button>
      </div>
    );
  }

  const fullName = `${driver.firstName} ${driver.lastName}`;

  const handleDocumentUpdate = (category: DocumentCategory, currentExpiry: string | null) => {
    setUploadCategory(category);
    setUploadCurrentExpiry(currentExpiry);
    setUploadModalOpen(true);
  };

  // Per-card tone for the Belgeler tab — surfaces warning state on the
  // outer container so the manager spots which docs need attention. Mirrors
  // ExpiryBadge's color buckets (≤7d → red, 8–30d → yellow). Non-mandatory
  // docs (ADR-driver, psychotechnical, CPC) only color when an on-record
  // date is expired/expiring; missing stays neutral.
  const cardToneFor = (
    date: string | null,
    mandatory: boolean,
  ): { border: string; bg: string } => {
    const days = daysUntil(date);
    if (days === null) {
      return mandatory
        ? { border: 'border-red-300', bg: 'bg-red-50' }
        : { border: 'border-gray-200', bg: 'bg-white' };
    }
    if (days < 0 || days <= 7) return { border: 'border-red-300', bg: 'bg-red-50' };
    if (days <= WARN_THRESHOLD_DAYS) return { border: 'border-yellow-300', bg: 'bg-yellow-50' };
    return { border: 'border-gray-200', bg: 'bg-white' };
  };

  const handleDocumentSave = async (category: DocumentCategory, expiryDate: string) => {
    if (!driverId) return;

    // Only update license expiry if a valid date is provided
    // When documents are uploaded/deleted, the expiry is automatically synced
    if (category === 'license' && expiryDate && expiryDate.trim() !== '') {
      await driverApi.updateLicense(driverId, expiryDate);
    }

    const updatedDriver = await driverApi.getById(driverId);
    setDriver(updatedDriver);
    refreshRoster();
  };

  const handleAddCertificate = async () => {
    if (!driverId) return;

    if (!certificateNumber || !certificateIssueDate || !certificateExpiryDate) {
      toast.warning(t('toast.warning.fillAllFields'));
      return;
    }

    // SRC is mandatory in Turkey for commercial freight — require the file so
    // the cert record isn't created without the underlying document.
    if (certificateType === 'SRC' && !certificateFile) {
      toast.error(t('driverDetail.certSrcFileRequired'));
      return;
    }

    // Client-side validation: check if expiry date is in the future
    const expiryDate = new Date(certificateExpiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (expiryDate < today) {
      toast.error(t('toast.error.expiryInPast'));
      return;
    }

    // Check if issue date is before expiry date
    const issueDate = new Date(certificateIssueDate);
    if (expiryDate < issueDate) {
      toast.error(t('toast.error.expiryBeforeIssue'));
      return;
    }

    try {
      await driverApi.addCertificate(driverId, {
        type: certificateType,
        number: certificateNumber,
        issueDate: certificateIssueDate,
        expiryDate: certificateExpiryDate,
      });

      // Upload the file (if provided). Non-fatal on failure: the structured
      // cert already exists, the manager is told to retry from the doc tile.
      if (certificateFile) {
        try {
          await driverApi.uploadDocument(
            driverId,
            certificateFile,
            certificateType === 'SRC' ? 'src' : 'cpc',
            certificateExpiryDate,
          );
        } catch (uploadErr) {
          console.error('Cert file upload failed after addCertificate', uploadErr);
          toast.warning(t('driverDetail.certUploadFailedToast'));
        }
      }

      // Reset form
      setShowAddCertificate(false);
      setCertificateNumber('');
      setCertificateIssueDate('');
      setCertificateExpiryDate('');
      setCertificateFile(null);

      const updatedDriver = await driverApi.getById(driverId);
      setDriver(updatedDriver);
      refreshRoster();

      toast.success(t('toast.success.certificateAdded'));
    } catch (err) {
      console.error('Error adding certificate:', err);
      const errorMessage = err instanceof Error ? err.message : t('toast.error.generic');

      // Show user-friendly error
      if (errorMessage.includes('already expired')) {
        toast.error(t('toast.error.expiredCertificate'));
      } else if (errorMessage.includes('already exists')) {
        toast.error(t('toast.error.duplicateCertificate'));
      } else {
        toast.error(errorMessage);
      }
    }
  };

  const runRemoveCertificate = async () => {
    if (!driverId || !certDeleteId) return;
    try {
      await driverApi.removeCertificate(driverId, certDeleteId);
      const updatedDriver = await driverApi.getById(driverId);
      setDriver(updatedDriver);
      refreshRoster();
      toast.success(t('toast.success.certificateRemoved'));
      setCertDeleteId(null);
    } catch (err) {
      console.error('Error removing certificate:', err);
      toast.error(t('toast.error.deleteCertificate'));
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
      toast.error(err instanceof Error ? err.message : t('toast.error.saveError'));
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
      toast.error(err instanceof Error ? err.message : t('toast.error.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const runDeleteDriver = async () => {
    if (!driverId) return;
    try {
      setDeleting(true);
      await driverApi.delete(driverId);
      toast.success(t('toast.success.driverDeleted'));
      setDriverDeleteOpen(false);
      refreshRoster();
      navigate('/manager/drivers');
    } catch (err) {
      console.error('Error deleting driver:', err);
      toast.error(err instanceof Error ? err.message : t('toast.error.generic'));
    } finally {
      setDeleting(false);
    }
  };

  const tabs: { id: Tab; label: React.ReactNode }[] = [
    { id: 'genel', label: t('driverDetail.tabs.genel') },
    {
      id: 'belgeler',
      label: (
        <span className="inline-flex items-center">
          {t('driverDetail.tabs.belgeler')}
          <TabSeverityBadge
            severity={worstSeverity(driverEntityWarnings)}
            count={driverEntityWarnings.filter((w) => w.severity !== 'INFO').length}
          />
        </span>
      ),
    },
  ];

  return (
    <div className="pb-16">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          aria-label={t('common.back')}
          className="w-9 h-9 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Avatar name={fullName} size="lg" className="flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 truncate">{fullName}</h1>
          {(() => {
            const status = deriveDriverStatus(driver);
            const badge = STATUS_BADGE[status];
            return (
              <span className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${badge.bg} ${badge.text}`}>
                {t(`derivedStatus.${status}`)}
              </span>
            );
          })()}
        </div>
      </div>

      {/* Tab bar — mirrors TruckDetailPage pattern */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Genel tab */}
      {activeTab === 'genel' && (
        <>
      <EntityWarningsRollup
        warnings={driverEntityWarnings}
        entityType="driver"
        onNavigate={() => setActiveTab('belgeler')}
      />

      {/* Contact info card */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">{t('driver.contactInfo')}</h2>
          {!editingContact && (
            <button onClick={startEditContact} className="text-sm text-primary-600 font-medium">
              {t('common.edit')}
            </button>
          )}
        </div>
        {editingContact ? (
          <div className="space-y-3">
            <TextInput
              label={t('driverDetail.firstName')}
              type="text"
              value={editFirstName}
              onChange={(e) => setEditFirstName(e.target.value)}
            />
            <TextInput
              label={t('driverDetail.lastName')}
              type="text"
              value={editLastName}
              onChange={(e) => setEditLastName(e.target.value)}
            />
            <TextInput
              label={t('driver.phone')}
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
            />
            <TextInput
              label={t('driver.email')}
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
            />
            <div className="flex gap-2 pt-1">
              <button onClick={handleSaveContact} disabled={saving}
                className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-primary-700 disabled:opacity-50">
                {saving ? t('driverDetail.saving') : t('driverDetail.save')}
              </button>
              <button onClick={() => setEditingContact(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50">
                {t('common.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-600 mb-1">{t('driver.phone')}</p>
              <p className="text-sm font-medium text-gray-900">{driver.phone}</p>
            </div>
            {driver.email && (
              <div>
                <p className="text-xs text-gray-600 mb-1">{t('driver.email')}</p>
                <p className="text-sm font-medium text-gray-900">{driver.email}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Emergency contact — collapsed when empty to reduce visual noise */}
      {editingEmergency || driver.emergencyContact ? (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">{t('driver.emergencyContact')}</h2>
            {!editingEmergency && (
              <button onClick={startEditEmergency} className="text-sm text-primary-600 font-medium">
                {t('driverDetail.edit')}
              </button>
            )}
          </div>
          {editingEmergency ? (
            <div className="space-y-3">
              <TextInput
                label={t('driver.contactName')}
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
              />
              <TextInput
                label={t('driver.contactPhone')}
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
              />
              <TextInput
                label={t('driver.relationship')}
                type="text"
                value={emergencyRelationship}
                onChange={(e) => setEmergencyRelationship(e.target.value)}
                placeholder=""
              />
              <div className="flex gap-2 pt-1">
                <button onClick={handleSaveEmergency} disabled={saving}
                  className="flex-1 py-2 bg-primary-600 text-white rounded-lg font-medium text-sm hover:bg-primary-700 disabled:opacity-50">
                  {saving ? t('driverDetail.saving') : t('driverDetail.save')}
                </button>
                <button onClick={() => setEditingEmergency(false)}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50">
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 mb-1">{t('driver.contactName')}</p>
                <p className="text-sm font-medium text-gray-900">{driver.emergencyContact!.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">{t('driver.contactPhone')}</p>
                <p className="text-sm font-medium text-gray-900">{driver.emergencyContact!.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">{t('driver.relationship')}</p>
                <p className="text-sm font-medium text-gray-900">{driver.emergencyContact!.relationship}</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={startEditEmergency}
          className="w-full mb-4 py-2.5 text-sm text-gray-600 hover:text-primary-600 border border-dashed border-gray-300 hover:border-primary-400 rounded-xl transition-colors"
        >
          + {t('driverDetail.addEmergencyContact')}
        </button>
      )}

      {/* Assigned-truck card: click-through to the truck detail. Previously a
          read-only plate display, which forced the user to navigate via the
          trucks list to reassign / see vehicle state. */}
      {driver.assignedTruckId && driver.assignedTruckPlate && (
        <Link
          to={`/manager/trucks/${driver.assignedTruckId}`}
          className="group flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm mb-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600 mb-0.5">{t('driver.assignedTruck')}</p>
            <p className="text-sm font-semibold text-gray-900 tracking-tight">{driver.assignedTruckPlate}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0" />
        </Link>
      )}

      {/* Invite status — NOT_INVITED (with email), PENDING, SENT, FAILED, ACCEPTED all surface here. */}
      {(() => {
        const status = driver.inviteStatus;
        const canInvite = !!driver.email && status !== 'ACCEPTED';
        if (status === 'NOT_INVITED' && !driver.email) {
          return null;
        }
        const tone =
          status === 'FAILED'
            ? { bg: 'bg-red-50 border-red-200', icon: 'text-red-500', text: 'text-red-700', btn: 'border-red-300 text-red-700 hover:bg-red-50' }
            : status === 'PENDING'
            ? { bg: 'bg-yellow-50 border-yellow-200', icon: 'text-yellow-500', text: 'text-yellow-700', btn: 'border-yellow-300 text-yellow-700 hover:bg-yellow-50' }
            : status === 'SENT'
            ? { bg: 'bg-emerald-50 border-emerald-200', icon: 'text-emerald-500', text: 'text-emerald-700', btn: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50' }
            : status === 'ACCEPTED'
            ? { bg: 'bg-emerald-100 border-emerald-300', icon: 'text-emerald-700', text: 'text-emerald-800', btn: '' }
            : { bg: 'bg-gray-50 border-gray-200', icon: 'text-gray-500', text: 'text-gray-700', btn: 'border-primary-300 text-primary-700 hover:bg-primary-50' };
        const label =
          status === 'FAILED' ? t('driverDetail.inviteFailed')
          : status === 'PENDING' ? t('driverDetail.invitePending')
          : status === 'SENT' ? t('driverDetail.inviteSent')
          : status === 'ACCEPTED' ? t('driverDetail.inviteAccepted')
          : t('driverDetail.inviteNotSent');
        return (
          <div className={`rounded-lg p-4 shadow-sm mb-4 border ${tone.bg}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className={`w-4 h-4 ${tone.icon}`} />
                <span className={`text-sm font-medium ${tone.text}`}>{label}</span>
              </div>
              {canInvite && (
                <button
                  onClick={async (e) => {
                    e.preventDefault();
                    try {
                      await driverApi.resendInvite(driver.id);
                      toast.success(t('toast.success.inviteResent'));
                      const data = await driverApi.getById(driver.id);
                      setDriver(data);
                    } catch {
                      toast.error(t('toast.error.inviteFailed'));
                    }
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 bg-white border rounded-lg text-xs font-medium ${tone.btn}`}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  {status === 'NOT_INVITED' ? t('common.send') : t('common.resend')}
                </button>
              )}
            </div>
          </div>
        );
      })()}

      {/* Delete driver — genuinely destructive (hard-delete, unlike truck
          archive). Red tone is semantic, but full-width at page bottom was
          overweight for a single-user action already gated by a confirm
          modal. Small red-ghost, right-aligned, matches archive's weight
          on the truck page so the two destructive actions read consistently. */}
      <div className="mt-8 text-right">
        <button
          onClick={() => setDriverDeleteOpen(true)}
          disabled={deleting}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400 transition-colors disabled:opacity-50"
        >
          {deleting ? t('driverDetail.deletingDriver') : t('driverDetail.deleteDriver')}
        </button>
      </div>
        </>
      )}

      {/* Belgeler tab */}
      {activeTab === 'belgeler' && (
        <>
          {/* License info card */}
          {(() => {
            const tone = cardToneFor(driver.licenseExpiryDate, true);
            return (
              <div className={`rounded-xl p-4 shadow-sm border mb-4 ${tone.border} ${tone.bg}`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-900">{t('driver.license')}</h2>
                  <button
                    onClick={() => handleDocumentUpdate('license', driver.licenseExpiryDate)}
                    className="text-sm text-primary-600 font-medium"
                  >
                    {t('documentCard.manageBtn')}
                  </button>
                </div>
                <div className="space-y-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{t('driver.licenseNumber')}</p>
                    <p className="text-sm font-medium text-gray-900">{driver.licenseNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{t('driver.licenseClass')}</p>
                    <p className="text-sm font-medium text-gray-900">{driver.licenseClass}</p>
                  </div>
                </div>
                <ExpiryBadge
                  label={t('driver.licenseExpiry')}
                  date={driver.licenseExpiryDate}
                />
              </div>
            );
          })()}

          {/* ADR (Driver) — non-mandatory; missing stays neutral. */}
          {(() => {
            const tone = cardToneFor(null, false);
            return (
              <div className={`rounded-xl p-4 shadow-sm border mb-4 ${tone.border} ${tone.bg}`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-900">{t('driver.adrDriver')}</h2>
                  <button
                    onClick={() => handleDocumentUpdate('adr-driver', null)}
                    className="text-sm text-primary-600 font-medium"
                  >
                    {t('documentCard.manageBtn')}
                  </button>
                </div>
                <ExpiryBadge label="" date={null} />
              </div>
            );
          })()}

          {/* Psikoteknik — non-mandatory; missing stays neutral. */}
          {(() => {
            const tone = cardToneFor(null, false);
            return (
              <div className={`rounded-xl p-4 shadow-sm border mb-4 ${tone.border} ${tone.bg}`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-bold text-gray-900">{t('driver.psychotechnical')}</h2>
                  <button
                    onClick={() => handleDocumentUpdate('psychotechnical', null)}
                    className="text-sm text-primary-600 font-medium"
                  >
                    {t('documentCard.manageBtn')}
                  </button>
                </div>
                <ExpiryBadge label="" date={null} />
              </div>
            );
          })()}

          {/* Certificates section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">{t('driver.certificates')}</h2>
              <button
                onClick={() => {
                  if (!certificateIssueDate) {
                    setCertificateIssueDate(new Date().toISOString().split('T')[0]);
                  }
                  setShowAddCertificate(true);
                }}
                className="text-sm text-primary-600 font-medium"
              >
                {t('driverDetail.addCertificate')}
              </button>
            </div>

            {/* Add Certificate Form */}
            {showAddCertificate && (
              <div className="bg-primary-50 border-2 border-primary-200 rounded-lg p-4 mb-3">
                <h3 className="text-sm font-bold text-gray-900 mb-3">{t('driverDetail.newCertificate')}</h3>
                <div className="space-y-3">
                  <Select
                    label={t('driverDetail.certType')}
                    required
                    value={certificateType}
                    onChange={(e) => setCertificateType(e.target.value as 'SRC' | 'CPC')}
                  >
                    <option value="SRC">{t('driverDetail.srcMandatory')}</option>
                    <option value="CPC">{t('driverDetail.cpcProfessional')}</option>
                  </Select>
                  <TextInput
                    label={t('driverDetail.certificateNumber')}
                    type="text"
                    value={certificateNumber}
                    onChange={(e) => setCertificateNumber(e.target.value)}
                    placeholder=""
                  />
                  <TextInput
                    label={t('driverDetail.issueDate')}
                    type="date"
                    value={certificateIssueDate}
                    onChange={(e) => setCertificateIssueDate(e.target.value)}
                  />
                  <TextInput
                    label={t('driverDetail.expiryDate')}
                    type="date"
                    value={certificateExpiryDate}
                    onChange={(e) => setCertificateExpiryDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    hint={<>⚠️ {t('driverDetail.expiryFutureWarning')}</>}
                  />
                  <FileInput
                    label={t('driverDetail.certFileLabel')}
                    required={certificateType === 'SRC'}
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(file) => setCertificateFile(file)}
                    selectedFileName={certificateFile?.name ?? null}
                  />
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleAddCertificate}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
                    >
                      {t('driverDetail.addButton')}
                    </button>
                    <button
                      onClick={() => {
                        setShowAddCertificate(false);
                        setCertificateNumber('');
                        setCertificateIssueDate('');
                        setCertificateExpiryDate('');
                        setCertificateFile(null);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Existing Certificates List */}
            {driver.certificates && driver.certificates.length > 0 && (
              <div className="space-y-3">
                {driver.certificates.map((cert, index) => (
                  <div key={index} className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-gray-900">
                        {cert.type === 'SRC' ? t('driver.srcCertificate') : t('driver.cpcCertificate')}
                      </h3>
                      <button
                        onClick={() => setCertDeleteId(cert.id)}
                        className="text-sm text-red-600 font-medium"
                      >
                        {t('common.delete')}
                      </button>
                    </div>
                    <div className="space-y-2 mb-3">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">{t('driver.certificateNumber')}</p>
                        <p className="text-sm font-medium text-gray-900">{cert.number}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">{t('driver.issueDate')}</p>
                        <p className="text-sm font-medium text-gray-900">{formatDate(cert.issueDate)}</p>
                      </div>
                    </div>
                    <ExpiryBadge
                      label={t('driver.expiryDate')}
                      date={cert.expiryDate}
                    />
                  </div>
                ))}
              </div>
            )}

            {driver.certificates && driver.certificates.length === 0 && !showAddCertificate && (
              <p className="text-sm text-gray-600">{t('driverDetail.noCertificates')}</p>
            )}
          </div>

          {/* Document upload history (audit trail) */}
          {documents.length > 0 && (
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900 mb-3">{t('driverDetail.documentHistory')}</h2>
              <div className="bg-white rounded-xl shadow-sm divide-y divide-gray-100">
                {documents.map((doc) => (
                  <div key={doc.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {documentTypeLabel(doc.documentType)}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(doc.uploadedAt)}</p>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 truncate">{doc.fileName}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs text-gray-500">
                        {t('driverDetail.uploadedBy')}: {doc.uploadedByName || '-'}
                      </p>
                      <div className="flex items-center gap-3">
                        {doc.expiryDate && (
                          <p className="text-xs text-gray-500">
                            {t('driverDetail.expiryLabel')}: {formatDate(doc.expiryDate)}
                          </p>
                        )}
                        <button
                          onClick={() => driverApi.downloadDocument(doc.id)}
                          className="text-xs text-primary-600 font-medium hover:text-primary-700"
                        >
                          {t('common.download')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
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

      {certDeleteId && (() => {
        const cert = driver.certificates?.find((c) => c.id === certDeleteId);
        const certTypeLabel = cert?.type === 'SRC'
          ? t('driver.srcCertificate')
          : cert?.type === 'CPC' ? t('driver.cpcCertificate') : t('driver.certificates');
        return (
          <ConfirmActionModal
            title={t('confirmDelete.certificate.title', { type: certTypeLabel })}
            description={t('confirmDelete.certificate.description', { type: certTypeLabel })}
            bullets={[t('common.irreversible')]}
            confirmLabel={t('common.delete')}
            tone="danger"
            onConfirm={runRemoveCertificate}
            onClose={() => setCertDeleteId(null)}
          />
        );
      })()}

      {driverDeleteOpen && (
        <ConfirmActionModal
          title={t('confirmDelete.driver.title')}
          description={t('confirmDelete.driver.description', { name: fullName })}
          bullets={[
            t('confirmDelete.driver.bulletPermanent'),
            t('confirmDelete.driver.bulletHistory'),
            t('confirmDelete.driver.bulletTruck'),
          ]}
          confirmLabel={t('common.delete')}
          tone="danger"
          onConfirm={runDeleteDriver}
          onClose={() => setDriverDeleteOpen(false)}
        />
      )}
    </div>
  );
};

export default DriverDetailPage;
