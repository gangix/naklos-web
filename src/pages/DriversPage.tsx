import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, AlertTriangle, CheckCircle, ClipboardList, Download, FileText, HardHat, Mail, Truck as TruckIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFleet } from '../contexts/FleetContext';
import { useFleetRoster } from '../contexts/FleetRosterContext';
import { useData } from '../contexts/DataContext';
import { formatDate } from '../utils/format';
import { deriveDriverStatus, STATUS_BADGE } from '../utils/derivedStatus';
import type { DerivedStatus } from '../utils/derivedStatus';
import DocumentReviewModal from '../components/common/DocumentReviewModal';
import TruckAssignmentModal from '../components/common/TruckAssignmentModal';
import AddDriverModal from '../components/common/AddDriverModal';
import BulkImportModal from '../components/common/BulkImportModal';
import UpgradeModal from '../components/common/UpgradeModal';
import type { DocumentSubmission, TruckAssignmentRequest } from '../types';
import { computeDriverWarnings, type DriverWarning } from '../utils/driverWarnings';
import { todayMidnightMs } from '../utils/expiry';

const DriversPage = () => {
  const { t } = useTranslation();
  const { plan } = useFleet();
  const { drivers, loading: driversLoading, refresh: refreshRoster } = useFleetRoster();
  const { documentSubmissions, truckAssignmentRequests } = useData();
  const maxDrivers = { FREE: 5, PROFESSIONAL: 25, BUSINESS: 100, ENTERPRISE: -1 }[plan] ?? 5;
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<'list' | 'pending' | 'history'>('list');
  const [filter, setFilter] = useState<DerivedStatus | 'all'>('all');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<DocumentSubmission | null>(null);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TruckAssignmentRequest | null>(null);
  const [addDriverModalOpen, setAddDriverModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | undefined>();

  /** Per-driver warnings via the shared {@link computeDriverWarnings} helper —
   *  same SRC-required / CPC-optional semantics used on the dashboard and
   *  driver detail page, so the list card, nav badge, and detail card all
   *  agree on what counts as a warning. */
  const warnings = useMemo<Array<DriverWarning & { relatedId: string }>>(() => {
    if (!drivers) return [];
    const todayMs = todayMidnightMs();
    const out: Array<DriverWarning & { relatedId: string }> = [];
    for (const d of drivers) {
      for (const w of computeDriverWarnings(d, todayMs)) {
        out.push({ ...w, relatedId: d.id });
      }
    }
    return out;
  }, [drivers]);

  // Handle query param for auto-tab selection
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'pending') {
      setTab('pending');
    } else if (tabParam === 'history') {
      setTab('history');
    }
  }, [searchParams]);

  // Dashboard quick-action support: `?add=1` auto-opens the add-driver modal
  // on mount. Consumed once — the param is stripped so reloads don't re-open
  // the modal. Falls through to the plan-limit upgrade nudge when needed.
  useEffect(() => {
    if (searchParams.get('add') !== '1') return;
    if (maxDrivers !== -1 && drivers.length >= maxDrivers) {
      setUpgradeMessage(undefined);
      setUpgradeModalOpen(true);
    } else {
      setAddDriverModalOpen(true);
    }
    const next = new URLSearchParams(searchParams);
    next.delete('add');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, maxDrivers, drivers.length]);

  // Get driver document submissions
  const driverSubmissions = useMemo(() => {
    return documentSubmissions.filter((doc) => doc.relatedType === 'driver');
  }, [documentSubmissions]);

  // Pending driver doc submissions
  const pendingDocSubmissions = useMemo(() => {
    return driverSubmissions.filter((doc) => doc.status === 'pending');
  }, [driverSubmissions]);

  // Pending truck assignment requests
  const pendingTruckRequests = useMemo(() => {
    return truckAssignmentRequests.filter((req) => req.status === 'pending');
  }, [truckAssignmentRequests]);

  // Completed driver doc submissions (for history)
  const completedDocSubmissions = useMemo(() => {
    return driverSubmissions.filter(
      (doc) => doc.status === 'approved' || doc.status === 'rejected'
    );
  }, [driverSubmissions]);

  // Completed truck requests (for history)
  const completedTruckRequests = useMemo(() => {
    return truckAssignmentRequests.filter(
      (req) => req.status === 'approved' || req.status === 'rejected'
    );
  }, [truckAssignmentRequests]);

  const hasUrgentWarning = (driverId: string): boolean =>
    warnings.some((w) => w.relatedId === driverId && w.severity === 'error');

  const getDriverWarnings = (driverId: string) =>
    warnings.filter((w) => w.relatedId === driverId);

  // Memoize derived status per driver to avoid repeated deriveDriverStatus calls
  const statusByDriverId = useMemo(() => {
    const map = new Map<string, DerivedStatus>();
    for (const d of drivers) map.set(d.id, deriveDriverStatus(d));
    return map;
  }, [drivers]);

  const statusCounts = useMemo<Record<DerivedStatus, number>>(() => {
    const acc: Record<DerivedStatus, number> = { ACTIVE: 0, READY: 0, MISSING_DOCS: 0 };
    for (const s of statusByDriverId.values()) acc[s]++;
    return acc;
  }, [statusByDriverId]);

  // Filter and sort drivers (warnings to the top)
  const filteredDrivers = useMemo(() => {
    let filtered = filter === 'all' ? drivers : drivers.filter((driver) => statusByDriverId.get(driver.id) === filter);

    // Sort drivers with warnings to the top
    return filtered.sort((a, b) => {
      const aHasWarning = hasUrgentWarning(a.id);
      const bHasWarning = hasUrgentWarning(b.id);

      if (aHasWarning && !bHasWarning) return -1;
      if (!aHasWarning && bHasWarning) return 1;
      return 0;
    });
  }, [filter, warnings, drivers, statusByDriverId]);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      license: t('categoryLabel.license'),
      src: t('categoryLabel.src'),
      cpc: t('categoryLabel.cpc'),
    };
    return labels[category] || category;
  };

  const getSubmissionStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: t('driversPage.pending') },
      approved: { bg: 'bg-green-100', text: 'text-green-700', label: t('driversPage.approved') },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', label: t('driversPage.rejected') },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const handleDocReviewClick = (submission: DocumentSubmission) => {
    setSelectedSubmission(submission);
    setReviewModalOpen(true);
  };

  const handleTruckRequestClick = (request: TruckAssignmentRequest) => {
    setSelectedRequest(request);
    setAssignmentModalOpen(true);
  };

  const totalPending = pendingDocSubmissions.length + pendingTruckRequests.length;

  // Show loading state
  if (driversLoading) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-4">{t('driver.title')}</h1>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
          {t('driver.title')}
          <span className="text-sm font-medium text-gray-400 ml-2">
            ({drivers.length}{maxDrivers !== -1 ? `/${maxDrivers}` : ''})
          </span>
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (plan === 'FREE') { setUpgradeMessage(t('bulkImport.bulkImportUpgrade')); setUpgradeModalOpen(true); }
              else setBulkImportOpen(true);
            }}
            className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50 transition-colors"
          >
            <Download className="w-4 h-4 inline -mt-0.5" /> {t('driversPage.import')}
          </button>
          <button
            onClick={() => {
              if (maxDrivers !== -1 && drivers.length >= maxDrivers) { setUpgradeMessage(undefined); setUpgradeModalOpen(true); }
              else setAddDriverModalOpen(true);
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all"
          >
            {t('driversPage.addDriver')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-100">
        <button
          onClick={() => setTab('list')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'list'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          {t('driversPage.drivers')} ({drivers.length})
        </button>
        {(completedDocSubmissions.length > 0 || completedTruckRequests.length > 0) && (
          <button
            onClick={() => setTab('history')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'history'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('driversPage.history')}
          </button>
        )}
        {totalPending > 0 && (
          <button
            onClick={() => setTab('pending')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'pending'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-orange-600 hover:text-orange-700'
            }`}
          >
            {t('driversPage.pendingApprovals')} ({totalPending})
          </button>
        )}
      </div>

      {/* Driver List Tab */}
      {tab === 'list' && (
        <>
          {/* Filter chips */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {([
              { key: 'all', label: t('driver.all'), count: drivers.length },
              { key: 'ACTIVE' as DerivedStatus, label: t('derivedStatus.ACTIVE'), count: statusCounts.ACTIVE },
              { key: 'READY' as DerivedStatus, label: t('derivedStatus.READY'), count: statusCounts.READY },
              { key: 'MISSING_DOCS' as DerivedStatus, label: t('derivedStatus.MISSING_DOCS'), count: statusCounts.MISSING_DOCS },
            ] as Array<{ key: DerivedStatus | 'all'; label: string; count: number }>).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap ${
                  filter === key
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          {/* Driver list */}
          <div className="space-y-3">
            {filteredDrivers.length === 0 && drivers.length === 0 && (
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-10 text-center">
                <HardHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('driversPage.emptyTitle')}</h3>
                <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
                  {t('driversPage.emptyHint')}
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <button
                    onClick={() => {
              if (plan === 'FREE') { setUpgradeMessage(t('bulkImport.bulkImportUpgrade')); setUpgradeModalOpen(true); }
              else setBulkImportOpen(true);
            }}
                    className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50"
                  >
                    <Download className="w-4 h-4 inline -mt-0.5" /> {t('driversPage.excelImport')}
                  </button>
                  <button
                    onClick={() => {
              if (maxDrivers !== -1 && drivers.length >= maxDrivers) { setUpgradeMessage(undefined); setUpgradeModalOpen(true); }
              else setAddDriverModalOpen(true);
            }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                  >
                    {t('driversPage.addFirst')}
                  </button>
                </div>
              </div>
            )}
            {filteredDrivers.length === 0 && drivers.length > 0 && (
              <div className="bg-white rounded-xl p-6 text-center text-gray-500">
                {t('driversPage.noFilterResult')}
              </div>
            )}
            {filteredDrivers.map((driver) => {
              const hasWarning = hasUrgentWarning(driver.id);
              return (
                <Link
                  key={driver.id}
                  to={`/manager/drivers/${driver.id}`}
                  className={`block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ${
                    hasWarning ? 'border-2 border-red-500' : 'border border-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">
                          {driver.firstName} {driver.lastName}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">{driver.phone}</p>
                      </div>
                      {hasUrgentWarning(driver.id) && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-md">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="text-xs font-medium text-red-700">{t('driversPage.warningLabel')}</span>
                        </div>
                      )}
                    </div>
                    {(() => {
                      const ds = statusByDriverId.get(driver.id)!;
                      const badge = STATUS_BADGE[ds];
                      return (
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
                          {t(`derivedStatus.${ds}`)}
                        </span>
                      );
                    })()}
                  </div>
                  {driver.assignedTruckPlate && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t('driver.assignedTruck')}: {driver.assignedTruckPlate}
                    </p>
                  )}

                  {driver.inviteStatus === 'FAILED' && (
                    <div className="flex items-center gap-1 mt-1">
                      <Mail className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-xs text-red-600 font-medium">{t('driverDetail.inviteFailed')}</span>
                    </div>
                  )}
                  {driver.inviteStatus === 'PENDING' && (
                    <div className="flex items-center gap-1 mt-1">
                      <Mail className="w-3.5 h-3.5 text-yellow-500" />
                      <span className="text-xs text-yellow-600 font-medium">{t('driverDetail.invitePending')}</span>
                    </div>
                  )}

                  {/* License & Certificate warnings */}
                  {getDriverWarnings(driver.id).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                      {getDriverWarnings(driver.id).map((warning, index) => (
                        <div
                          key={`${warning.relatedId}-${warning.type}-${index}`}
                          className={`text-xs px-2 py-1 rounded ${
                            warning.severity === 'error'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-yellow-50 text-yellow-700'
                          }`}
                        >
                          <span className="inline-flex items-center gap-1">{warning.severity === 'error' ? <AlertCircle className="w-3.5 h-3.5 text-red-500 inline flex-shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-orange-500 inline flex-shrink-0" />} {t(warning.key, warning.params)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Pending Approvals Tab */}
      {tab === 'pending' && (
        <div className="space-y-6">
          {totalPending === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">{t('driversPage.noPending')}</p>
              <p className="text-sm text-gray-600">{t('driversPage.allProcessed')}</p>
            </div>
          ) : (
            <>
              {/* {t('driversPage.docApprovals')} Section */}
              {pendingDocSubmissions.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">{t('driversPage.docApprovals')}</h2>
                  <div className="space-y-3">
                    {pendingDocSubmissions.map((submission) => (
                      <button
                        key={submission.id}
                        onClick={() => handleDocReviewClick(submission)}
                        className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-left border-2 border-transparent hover:border-primary-500"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-5 h-5 text-gray-500" />
                              <h3 className="text-sm font-bold text-gray-900">
                                {getCategoryLabel(submission.category)}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-600">
                              {t('driversPage.driverLabel')}: <span className="font-medium">{submission.relatedName}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {t('driversPage.sender')}: {submission.submittedByName}
                            </p>
                          </div>
                          {getSubmissionStatusBadge(submission.status)}
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatDate(submission.submittedAt)}</span>
                          <span className="text-primary-600 font-medium">{t('driversPage.review')} →</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* {t('driversPage.truckRequests')} Section */}
              {pendingTruckRequests.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">{t('driversPage.truckRequests')}</h2>
                  <div className="space-y-3">
                    {pendingTruckRequests.map((request) => (
                      <button
                        key={request.id}
                        onClick={() => handleTruckRequestClick(request)}
                        className="w-full bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-left border-2 border-transparent hover:border-primary-500"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <TruckIcon className="w-5 h-5 text-gray-500" />
                              <h3 className="text-sm font-bold text-gray-900">{t('driversPage.truckRequestLabel')}</h3>
                            </div>
                            <p className="text-sm text-gray-600">
                              {t('driversPage.driverLabel')}: <span className="font-medium">{request.driverName}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {t('driversPage.preference')}: {request.preferredTruckPlate}
                            </p>
                          </div>
                          {getSubmissionStatusBadge(request.status)}
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatDate(request.requestedAt)}</span>
                          <span className="text-primary-600 font-medium">{t('driversPage.review')} →</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="space-y-3">
          {completedDocSubmissions.length === 0 && completedTruckRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <ClipboardList className="w-14 h-14 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">{t('driversPage.noHistory')}</p>
              <p className="text-sm text-gray-600">{t('driversPage.historyHint')}</p>
            </div>
          ) : (
            <>
              {completedDocSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 opacity-60"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText className="w-5 h-5 text-gray-500" />
                        <h3 className="text-sm font-bold text-gray-900">
                          {getCategoryLabel(submission.category)}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        {t('driversPage.driverLabel')}: <span className="font-medium">{submission.relatedName}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('driversPage.sender')}: {submission.submittedByName}
                      </p>
                    </div>
                    {getSubmissionStatusBadge(submission.status)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(submission.submittedAt)}
                  </div>
                </div>
              ))}
              {completedTruckRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 opacity-60"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <TruckIcon className="w-5 h-5 text-gray-500" />
                        <h3 className="text-sm font-bold text-gray-900">{t('driversPage.truckRequestLabel')}</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        {t('driversPage.driverLabel')}: <span className="font-medium">{request.driverName}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('driversPage.preference')}: {request.preferredTruckPlate}
                      </p>
                    </div>
                    {getSubmissionStatusBadge(request.status)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(request.requestedAt)}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Document Review Modal */}
      {reviewModalOpen && selectedSubmission && (
        <DocumentReviewModal
          isOpen={reviewModalOpen}
          onClose={() => {
            setReviewModalOpen(false);
            setSelectedSubmission(null);
          }}
          submission={selectedSubmission}
        />
      )}

      {/* Truck Assignment Modal */}
      {assignmentModalOpen && selectedRequest && (
        <TruckAssignmentModal
          isOpen={assignmentModalOpen}
          onClose={() => {
            setAssignmentModalOpen(false);
            setSelectedRequest(null);
          }}
          request={selectedRequest}
        />
      )}

      {/* Add Driver Modal */}
      <AddDriverModal
        isOpen={addDriverModalOpen}
        onClose={() => setAddDriverModalOpen(false)}
        onSuccess={refreshRoster}
      />

      <BulkImportModal
        isOpen={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        onSuccess={refreshRoster}
        entityType="driver"
      />

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => { setUpgradeModalOpen(false); setUpgradeMessage(undefined); }}
        resource="driver"
        currentPlan={plan}
        message={upgradeMessage}
      />
    </div>
  );
};

export default DriversPage;
