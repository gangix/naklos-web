import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Gauge, MapPin } from 'lucide-react';
import { truckApi, type TruckDocumentExpiryUpdate } from '../services/api';
import { useFleet } from '../contexts/FleetContext';
import { useFleetRoster } from '../contexts/FleetRosterContext';
import { useTranslation } from 'react-i18next';
import { formatDate, formatDecimal } from '../utils/format';
import ExpiryBadge from '../components/common/ExpiryBadge';
import SimpleDocumentUpdateModal from '../components/common/SimpleDocumentUpdateModal';
import ConfirmActionModal from '../components/fuel/ConfirmActionModal';
import { Select } from '../components/common/FormField';
import { deriveTruckStatus, STATUS_BADGE } from '../utils/derivedStatus';
import { efficiencyStatus } from '../utils/fuelStats';
import { computeTruckWarnings } from '../utils/truckWarnings';
import TruckFuelTab from '../components/fuel/TruckFuelTab';
import EfficiencyStatusPill from '../components/fuel/EfficiencyStatusPill';
import TruckAnomalyOverridesSection from '../components/fuel-alerts/TruckAnomalyOverridesSection';
import MaintenanceTab from '../components/maintenance/MaintenanceTab';
import { pushRecent } from '../utils/recentEntities';
import { useFuelCounts } from '../contexts/FuelCountsContext';
import { maintenanceApi } from '../services/maintenanceApi';
import EntityWarningsRollup from '../components/common/EntityWarningsRollup';
import TabSeverityBadge from '../components/common/TabSeverityBadge';
import type { DocumentCategory, Truck } from '../types';
import type { TruckFuelEntryDto } from '../types/fuel';
import type { EntityWarning } from '../types/entityWarning';
import type { MaintenanceScheduleDto } from '../types/maintenance';
import { worstSeverity, severityFromDays } from '../utils/severity';
import { daysUntil, WARN_THRESHOLD_DAYS } from '../utils/expiry';

type Tab = 'genel' | 'yakit' | 'belgeler' | 'bakim';

const TruckDetailPage = () => {
  const { t } = useTranslation();
  const { truckId } = useParams<{ truckId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { fleetId, plan } = useFleet();
  const { drivers, refresh: refreshRoster } = useFleetRoster();
  // Mirrors the ManagerTopNav gate — anomaly features are a paid-plan UX.
  // FREE users see the Yakıt tab with manual entry but not the overrides panel.
  const forceOn = import.meta.env.VITE_FEATURE_FUEL_TRACKING === 'true';
  const anomalyUiEnabled = forceOn || (plan !== 'FREE' && plan !== undefined);
  const [truck, setTruck] = useState<Truck | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Honor deep-link ?tab=... on mount (fuel-alerts "Kaydı düzelt" routes
  // here with ?tab=yakit&entry=<id>). Unknown values fall back to 'genel'.
  const initialTabFromQuery = searchParams.get('tab') as Tab | null;
  const [activeTab, setActiveTab] = useState<Tab>(
    initialTabFromQuery === 'yakit' || initialTabFromQuery === 'belgeler' || initialTabFromQuery === 'genel'
      ? initialTabFromQuery
      : 'genel',
  );
  const [openEditEntryId, setOpenEditEntryId] = useState<string | null>(
    () => searchParams.get('entry'),
  );
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory | null>(null);
  const [uploadCurrentExpiry, setUploadCurrentExpiry] = useState<string | null>(null);
  const [showDriverSelect, setShowDriverSelect] = useState(false);
  const [assigningDriver, setAssigningDriver] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'delete' | null>(null);

  useEffect(() => {
    if (!truckId) return;

    const fetchTruck = async () => {
      try {
        setLoading(true);
        const data = await truckApi.getById(truckId);
        setTruck(data);
      } catch (err) {
        console.error('Error fetching truck:', err);
        setError(err instanceof Error ? err.message : t('truckDetail.loadError'));
      } finally {
        setLoading(false);
      }
    };

    const fetchDocuments = async () => {
      try {
        const docs = await truckApi.getDocuments(truckId);
        setDocuments(docs as any[]);
      } catch (err) {
        console.error('Error fetching truck documents:', err);
      }
    };

    fetchTruck();
    fetchDocuments();
  }, [truckId]);

  const truckWarnings = truck ? computeTruckWarnings(truck) : [];

  const { pendingItems: allFuelAnomalies } = useFuelCounts();
  const [maintenanceSchedules, setMaintenanceSchedules] = useState<MaintenanceScheduleDto[]>([]);

  useEffect(() => {
    if (!fleetId || !truckId) return;
    maintenanceApi.listSchedules(fleetId, truckId)
      .then(setMaintenanceSchedules)
      .catch(() => setMaintenanceSchedules([]));
  }, [fleetId, truckId]);

  // Record a "recent visit" so the ⌘K palette can surface this truck as a
  // quick-jump target on subsequent sessions. Fires once per load.
  useEffect(() => {
    if (!truck) return;
    pushRecent({ type: 'truck', id: truck.id, label: truck.plateNumber, sublabel: truck.type });
  }, [truck]);

  // When a manager clicks through from a "needs attention" context, default to
  // the Documents tab so they don't have to pivot after landing. Once the user
  // actively switches tabs, stop overriding. A deep-link ?tab=... or
  // #maintenance counts as an explicit choice, so we seed `tabAutoPicked` to
  // true in those cases to suppress the warnings-based override.
  const [tabAutoPicked, setTabAutoPicked] = useState(
    () => !!initialTabFromQuery || (typeof window !== 'undefined' && window.location.hash === '#maintenance'),
  );
  useEffect(() => {
    if (!truck || tabAutoPicked) return;
    setTabAutoPicked(true);
    if (truckWarnings.length > 0) setActiveTab('belgeler');
  }, [truck, tabAutoPicked, truckWarnings.length]);

  // Consume ?tab and ?entry once on mount so a page reload doesn't re-open
  // the edit modal. State already holds the values we read synchronously.
  useEffect(() => {
    if (!searchParams.get('tab') && !searchParams.get('entry')) return;
    const next = new URLSearchParams(searchParams);
    next.delete('tab');
    next.delete('entry');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Deep-link: dashboard's maintenance row navigates here with #maintenance.
  // Switch to the Bakım tab on mount so the user lands directly on it instead
  // of having to find the tab manually after the page loads.
  useEffect(() => {
    if (window.location.hash === '#maintenance') {
      setActiveTab('bakim');
    }
  }, []);

  const truckEntityWarnings = useMemo<EntityWarning[]>(() => {
    if (!truck) return [];

    const warnings: EntityWarning[] = [];

    // Doc warnings (mandatory + within 30 days, OR mandatory + missing)
    const docs: Array<{ date: string | null; key: string; mandatory: boolean }> = [
      { date: truck.compulsoryInsuranceExpiry,    key: 'doc.compulsoryInsurance',    mandatory: true },
      { date: truck.comprehensiveInsuranceExpiry, key: 'doc.comprehensiveInsurance', mandatory: true },
      { date: truck.inspectionExpiry,             key: 'doc.inspection',             mandatory: true },
    ];
    for (const d of docs) {
      if (!d.date) {
        if (d.mandatory) {
          warnings.push({ kind: 'doc', severity: 'CRITICAL', labelKey: d.key, daysLeft: null, isMandatory: true });
        }
        continue;
      }
      const days = daysUntil(d.date);
      if (days !== null && days <= WARN_THRESHOLD_DAYS) {
        warnings.push({
          kind: 'doc',
          severity: severityFromDays(days),
          labelKey: d.key,
          daysLeft: days,
          isMandatory: d.mandatory,
        });
      }
    }

    // Fuel anomalies for THIS truck
    for (const a of allFuelAnomalies) {
      if (a.truckId !== truckId) continue;
      warnings.push({
        kind: 'fuel',
        severity: a.severity,
        ruleCode: a.ruleCode,
        detectedAt: a.detectedAt,
        anomalyId: a.anomalyId,
      });
    }

    // Maintenance schedules due within 30 days
    const todayMs = Date.now();
    for (const s of maintenanceSchedules) {
      if (!s.nextDueAt) continue;
      const days = Math.ceil((new Date(s.nextDueAt).getTime() - todayMs) / (1000 * 60 * 60 * 24));
      if (days > 30) continue;
      warnings.push({
        kind: 'maintenance',
        severity: severityFromDays(days),
        label: s.kind === 'CUSTOM' ? (s.customLabel ?? s.kind) : t(`maintenance.kind.${s.kind}`),
        daysLeft: days,
        scheduleId: s.id,
        reason: 'TIME',
      });
    }

    return warnings;
  }, [truck, truckId, allFuelAnomalies, maintenanceSchedules, t]);

  const docWarnings = useMemo(() => truckEntityWarnings.filter((w) => w.kind === 'doc'), [truckEntityWarnings]);
  const fuelWarnings = useMemo(() => truckEntityWarnings.filter((w) => w.kind === 'fuel'), [truckEntityWarnings]);
  const maintenanceWarnings = useMemo(() => truckEntityWarnings.filter((w) => w.kind === 'maintenance'), [truckEntityWarnings]);

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

  if (error || !truck) {
    return (
      <div >
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-center text-red-600">{error || t('truckDetail.notFound')}</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 mx-auto block px-4 py-2 bg-primary-600 text-white rounded-lg"
        >
          {t('common.back')}
        </button>
      </div>
    );
  }

  const documentTypeLabel = (type: string) => {
    switch (type) {
      case 'compulsory-insurance': return t('truck.compulsoryInsurance');
      case 'comprehensive-insurance': return t('truck.comprehensiveInsurance');
      case 'inspection': return t('truck.inspection');
      default: return type;
    }
  };

  const handleAssignDriver = async (driverId: string) => {
    if (!truckId) return;

    try {
      setAssigningDriver(true);
      const updatedTruck = await truckApi.assignDriver(truckId, driverId);
      setTruck(updatedTruck);
      setShowDriverSelect(false);
      refreshRoster();
    } catch (err) {
      console.error('Error assigning driver:', err);
      toast.error(t('toast.error.assignDriver'));
    } finally {
      setAssigningDriver(false);
    }
  };

  // Instant — symmetric with assign. The "already on another truck" label on
  // the driver-select dropdown (P1-5) covers the reassignment-warning case
  // that the old confirm modal was protecting against.
  const handleUnassignDriver = async () => {
    if (!truckId) return;
    try {
      setAssigningDriver(true);
      const updatedTruck = await truckApi.unassignDriver(truckId);
      setTruck(updatedTruck);
      refreshRoster();
    } catch (err) {
      console.error('Error unassigning driver:', err);
      toast.error(t('toast.error.removeDriver'));
    } finally {
      setAssigningDriver(false);
    }
  };

  const handleDocumentUpdate = (category: DocumentCategory, currentExpiry: string | null) => {
    setUploadCategory(category);
    setUploadCurrentExpiry(currentExpiry);
    setUploadModalOpen(true);
  };

  const handleDocumentSave = async (category: DocumentCategory, expiryDate: string) => {
    if (!truckId) return;

    const updateData: TruckDocumentExpiryUpdate = {};

    if (category === 'compulsory-insurance') {
      updateData.compulsoryInsuranceExpiry = expiryDate;
    } else if (category === 'comprehensive-insurance') {
      updateData.comprehensiveInsuranceExpiry = expiryDate;
    } else if (category === 'inspection') {
      updateData.inspectionExpiry = expiryDate;
    }

    // For new categories (tachograph, k-certificate, adr-vehicle) there's no
    // denormalized expiry field on the Truck entity yet — the modal already
    // uploaded the document; skip the empty updateDocuments call. Backend sync
    // for those expiries is tracked as a followup.
    if (Object.keys(updateData).length > 0) {
      await truckApi.updateDocuments(truckId, updateData);
    }

    // Refresh truck data — document list or denormalized field may have changed.
    const updatedTruck = await truckApi.getById(truckId);
    setTruck(updatedTruck);
    refreshRoster();
  };

  const runDeleteTruck = async () => {
    if (!truckId) return;
    try {
      await truckApi.delete(truckId);
      setConfirmAction(null);
      refreshRoster();
      navigate('/manager/trucks');
    } catch (err) {
      console.error('Error deleting truck:', err);
      toast.error(t('toast.error.deleteTruck'));
    }
  };

  // Map Truck type's fuelType field to the UC-4 union if available. The BE
  // shape may include a primaryFuelType field that isn't yet on the Truck
  // domain type — narrow via an inline intersection rather than `as any` so
  // type-checking still catches typos in the property name.
  const truckPrimaryFuelType = (truck as Truck & { primaryFuelType?: TruckFuelEntryDto['fuelType'] }).primaryFuelType;

  const tabs: { id: Tab; label: React.ReactNode }[] = [
    { id: 'genel', label: t('truckDetail.tabs.genel') },
    {
      id: 'yakit',
      label: (
        <span className="inline-flex items-center">
          {t('truckDetail.tabs.yakit')}
          <TabSeverityBadge
            severity={worstSeverity(fuelWarnings)}
            count={fuelWarnings.filter((w) => w.severity !== 'INFO').length}
          />
        </span>
      ),
    },
    {
      id: 'bakim',
      label: (
        <span className="inline-flex items-center">
          {t('truckDetail.tabs.bakim')}
          <TabSeverityBadge
            severity={worstSeverity(maintenanceWarnings)}
            count={maintenanceWarnings.filter((w) => w.severity !== 'INFO').length}
          />
        </span>
      ),
    },
    {
      id: 'belgeler',
      label: (
        <span className="inline-flex items-center">
          {t('truckDetail.tabs.belgeler')}
          <TabSeverityBadge
            severity={worstSeverity(docWarnings)}
            count={docWarnings.filter((w) => w.severity !== 'INFO').length}
          />
        </span>
      ),
    },
  ];

  const complianceDocs = documents.filter((doc) => doc.documentType !== 'fuel-receipt');

  return (
    <div className="p-4 pb-20">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          aria-label={t('common.back')}
          className="w-9 h-9 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center justify-center transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">{truck.plateNumber}</h1>
          <p className="text-sm text-gray-600 mt-1">{truck.type}</p>
        </div>
      </div>

      {/* Tab bar */}
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
            warnings={truckEntityWarnings}
            entityType="truck"
            groupByKind
            onNavigate={(w) => {
              if (w.kind === 'doc') setActiveTab('belgeler');
              else if (w.kind === 'maintenance') setActiveTab('bakim');
              // Fuel anomalies live on the fuel-alerts page (the canonical
              // confirm/dismiss surface). The truck's Yakıt tab is fuel
              // ENTRIES, which doesn't surface anomalies — sending the
              // manager there leaves them stuck. Land on /fuel-alerts
              // filtered to this truck instead.
              else if (w.kind === 'fuel') navigate(`/manager/fuel-alerts?truckId=${truckId}`);
            }}
          />

          {/* Basic info card */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4">
            <h2 className="text-lg font-extrabold tracking-tight text-gray-900 mb-3">{t('truck.basicInfo')}</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('truck.status')}</span>
                {(() => {
                  const status = deriveTruckStatus(truck);
                  const badge = STATUS_BADGE[status];
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${badge.bg} ${badge.text}`}>
                      {t(`derivedStatus.${status}`)}
                    </span>
                  );
                })()}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{t('truck.driver')}</span>
                <div className="flex items-center gap-2">
                  {truck.currentDriverId ? (
                    <>
                      <span className="text-sm font-medium text-gray-900">
                        {truck.assignedDriverName}
                      </span>
                      <button
                        onClick={handleUnassignDriver}
                        disabled={assigningDriver}
                        className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
                      >
                        {t('common.remove')}
                      </button>
                    </>
                  ) : (
                    <>
                      {!showDriverSelect ? (
                        <button
                          onClick={() => setShowDriverSelect(true)}
                          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                          {t('truckDetail.assignDriver')}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="min-w-0">
                            <Select
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAssignDriver(e.target.value);
                                }
                              }}
                              disabled={assigningDriver}
                              defaultValue=""
                            >
                              <option value="">{t('truckDetail.selectDriver')}</option>
                              {/* Drivers already assigned to ANOTHER truck are
                                  shown with a suffix so the manager doesn't
                                  silently reassign someone away. Picking them
                                  still works — the old truck gets unassigned
                                  server-side (TruckService.assignDriver). */}
                              {drivers.map((driver) => {
                                const otherTruckPlate =
                                  driver.assignedTruckId && driver.assignedTruckId !== truck.id
                                    ? driver.assignedTruckPlate
                                    : null;
                                return (
                                  <option key={driver.id} value={driver.id}>
                                    {driver.firstName} {driver.lastName}
                                    {otherTruckPlate
                                      ? ` · ${t('truckDetail.driverAssignedTo', { plate: otherTruckPlate })}`
                                      : ''}
                                  </option>
                                );
                              })}
                            </Select>
                          </div>
                          <button
                            onClick={() => setShowDriverSelect(false)}
                            className="text-xs text-gray-600 hover:text-gray-700 flex-shrink-0"
                          >
                            {t('common.cancel')}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {(truck.expectedLPer100KmDerived !== null || truck.expectedLPer100KmManual !== null) && (
            <FuelEfficiencyCard truck={truck} onOpenEntries={() => setActiveTab('yakit')} />
          )}

          {/* Location card */}
          {truck.lastPosition && (
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4">
              <h2 className="text-lg font-extrabold tracking-tight text-gray-900 mb-3">{t('truck.location')}</h2>
              <div className="flex items-center gap-2">
                <MapPin className="w-6 h-6 text-primary-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{truck.lastPosition.city}</p>
                  <p className="text-xs text-gray-500">
                    {truck.lastPosition.lat.toFixed(4)}, {truck.lastPosition.lng.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Archive (soft-delete). Non-destructive — history is preserved —
              so a full-width red button would over-signal severity. A ghost
              button with amber tone matches the weight of the action; the
              ConfirmActionModal is the real friction guard. */}
          <div className="mt-8 text-right">
            <button
              onClick={() => setConfirmAction('delete')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 transition-colors"
            >
              {t('truckDetail.deleteTruck')}
            </button>
          </div>
        </>
      )}

      {/* Yakıt tab */}
      {activeTab === 'yakit' && fleetId && (
        <>
          <TruckFuelTab
            fleetId={fleetId}
            truckId={truck.id}
            truckPlate={truck.plateNumber}
            truckPrimaryFuelType={truckPrimaryFuelType}
            openEditEntryId={openEditEntryId}
            onEditHandled={() => setOpenEditEntryId(null)}
          />
          {anomalyUiEnabled && (
            <TruckAnomalyOverridesSection fleetId={fleetId} truckId={truck.id} />
          )}
        </>
      )}

      {/* Belgeler tab */}
      {activeTab === 'belgeler' && (
        <>
          {/* Document expiry section */}
          <div className="mb-4">
            <div className="space-y-3">
              {/* Compulsory Insurance */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-extrabold tracking-tight text-gray-900">{t('truck.compulsoryInsurance')}</h3>
                  <button
                    onClick={() => handleDocumentUpdate('compulsory-insurance', truck.compulsoryInsuranceExpiry)}
                    className="text-sm text-primary-600 font-medium"
                  >
                    {t('documentCard.manageBtn')}
                  </button>
                </div>
                <ExpiryBadge
                  label=""
                  date={truck.compulsoryInsuranceExpiry}
                />
              </div>

              {/* Comprehensive Insurance */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-extrabold tracking-tight text-gray-900">{t('truck.comprehensiveInsurance')}</h3>
                  <button
                    onClick={() => handleDocumentUpdate('comprehensive-insurance', truck.comprehensiveInsuranceExpiry)}
                    className="text-sm text-primary-600 font-medium"
                  >
                    {t('documentCard.manageBtn')}
                  </button>
                </div>
                <ExpiryBadge
                  label=""
                  date={truck.comprehensiveInsuranceExpiry}
                />
              </div>

              {/* Inspection */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-extrabold tracking-tight text-gray-900">{t('truck.inspection')}</h3>
                  <button
                    onClick={() => handleDocumentUpdate('inspection', truck.inspectionExpiry)}
                    className="text-sm text-primary-600 font-medium"
                  >
                    {t('documentCard.manageBtn')}
                  </button>
                </div>
                <ExpiryBadge
                  label=""
                  date={truck.inspectionExpiry}
                />
              </div>

              {/* Tachograph */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-extrabold tracking-tight text-gray-900">{t('truck.tachograph')}</h3>
                  <button
                    onClick={() => handleDocumentUpdate('tachograph', null)}
                    className="text-sm text-primary-600 font-medium"
                  >
                    {t('documentCard.manageBtn')}
                  </button>
                </div>
                <ExpiryBadge
                  label=""
                  date={null}
                />
              </div>

              {/* K-type transport permit */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-extrabold tracking-tight text-gray-900">{t('truck.kCertificate')}</h3>
                  <button
                    onClick={() => handleDocumentUpdate('k-certificate', null)}
                    className="text-sm text-primary-600 font-medium"
                  >
                    {t('documentCard.manageBtn')}
                  </button>
                </div>
                <ExpiryBadge
                  label=""
                  date={null}
                />
              </div>

              {/* ADR (vehicle) */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-extrabold tracking-tight text-gray-900">{t('truck.adrVehicle')}</h3>
                  <button
                    onClick={() => handleDocumentUpdate('adr-vehicle', null)}
                    className="text-sm text-primary-600 font-medium"
                  >
                    {t('documentCard.manageBtn')}
                  </button>
                </div>
                <ExpiryBadge
                  label=""
                  date={null}
                />
              </div>
            </div>
          </div>

          {/* Document upload history (audit trail) — fuel-receipt docs filtered out */}
          {complianceDocs.length > 0 && (
            <div className="mb-4">
              <h2 className="text-lg font-extrabold tracking-tight text-gray-900 mb-3">{t('truckDetail.documentHistory')}</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
                {complianceDocs.map((doc) => (
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
                        {t('truckDetail.uploadedBy')}: {doc.uploadedByName || '-'}
                      </p>
                      <div className="flex items-center gap-3">
                        {doc.expiryDate && (
                          <p className="text-xs text-gray-500">
                            {t('truckDetail.expiryLabel')}: {formatDate(doc.expiryDate)}
                          </p>
                        )}
                        <button
                          onClick={() => truckApi.downloadDocument(doc.id)}
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

      {activeTab === 'bakim' && fleetId && truckId && (
        <MaintenanceTab
          fleetId={fleetId}
          truckId={truckId}
          schedules={maintenanceSchedules}
          onSchedulesChanged={setMaintenanceSchedules}
        />
      )}

      {/* Document Update Modal */}
      {uploadModalOpen && uploadCategory && (
        <SimpleDocumentUpdateModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          category={uploadCategory}
          relatedType="truck"
          relatedId={truck.id}
          relatedName={truck.plateNumber}
          currentExpiryDate={uploadCurrentExpiry}
          onUpdate={handleDocumentSave}
        />
      )}

      {confirmAction === 'delete' && (
        <ConfirmActionModal
          title={t('confirmDelete.truck.title')}
          description={t('confirmDelete.truck.description', { plate: truck.plateNumber })}
          bullets={[
            t('confirmDelete.truck.bulletHistory'),
            t('confirmDelete.truck.bulletHidden'),
            t('confirmDelete.truck.bulletPlateReuse'),
          ]}
          confirmLabel={t('common.archive')}
          tone="danger"
          onConfirm={runDeleteTruck}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
};

export default TruckDetailPage;

// ───────────────────────────────────────────────────────────────────────────
// Local cards for the Genel tab
// ───────────────────────────────────────────────────────────────────────────

/** Actual vs target consumption mini-card. Echoes the Yakıt Kayıtları hero
 *  but compressed. Delegates the status pill to the shared primitive. */
const FuelEfficiencyCard = ({
  truck,
  onOpenEntries,
}: {
  truck: Truck;
  onOpenEntries: () => void;
}) => {
  const { t } = useTranslation();
  const actual = truck.expectedLPer100KmDerived;
  const target = truck.expectedLPer100KmManual;
  const { status, deviationPct } = efficiencyStatus(actual, target);
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-extrabold tracking-tight text-gray-900 flex items-center gap-2">
          <Gauge className="w-5 h-5 text-primary-600" />
          {t('truckDetail.efficiency.heading')}
        </h2>
        <button
          onClick={onOpenEntries}
          className="text-xs text-primary-600 font-medium hover:underline"
        >
          {t('truckDetail.efficiency.seeEntries')}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            {t('fuelEntry.efficiency.actual')}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-gray-900 tracking-tight tabular-nums">
              {actual !== null ? formatDecimal(actual) : '—'}
            </span>
            <span className="text-xs text-gray-500 font-medium">
              {t('fuelEntry.summary.avgConsumptionUnit')}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            {actual !== null
              ? t('fuelEntry.efficiency.actualSource')
              : t('fuelEntry.summary.avgConsumptionEmpty')}
          </p>
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
            {t('fuelEntry.efficiency.target')}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-gray-400 tracking-tight tabular-nums">
              {target !== null ? formatDecimal(target) : '—'}
            </span>
            <span className="text-xs text-gray-400 font-medium">
              {t('fuelEntry.summary.avgConsumptionUnit')}
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            {target !== null
              ? t('fuelEntry.efficiency.targetSource')
              : t('fuelEntry.efficiency.targetEmpty')}
          </p>
        </div>
      </div>
      {actual !== null && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <EfficiencyStatusPill
            status={status}
            deviationPct={deviationPct}
            hasTarget={target !== null}
          />
        </div>
      )}
    </div>
  );
};

