import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, AlertTriangle, CheckCircle, ClipboardList, Download, FileText, MapPin, Truck as TruckIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFleet } from '../contexts/FleetContext';
import { useFleetRoster } from '../contexts/FleetRosterContext';
import { useData } from '../contexts/DataContext';
import { formatDate, formatDecimal, formatRelativeTime } from '../utils/format';
import { deriveTruckStatus, STATUS_BADGE } from '../utils/derivedStatus';
import type { DerivedStatus } from '../utils/derivedStatus';
import { computeTruckWarnings } from '../utils/truckWarnings';
import { todayMidnightMs } from '../utils/expiry';
import DocumentReviewModal from '../components/common/DocumentReviewModal';
import AddTruckModal from '../components/common/AddTruckModal';
import BulkImportModal from '../components/common/BulkImportModal';
import UpgradeModal from '../components/common/UpgradeModal';
import type { DocumentSubmission } from '../types';

const TrucksPage = () => {
  const { t } = useTranslation();
  const { plan } = useFleet();
  const { trucks, loading: trucksLoading, refresh: refreshRoster } = useFleetRoster();
  const { documentSubmissions } = useData();
  const maxTrucks = { FREE: 5, PROFESSIONAL: 25, BUSINESS: 100, ENTERPRISE: -1 }[plan] ?? 5;
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<'list' | 'pending' | 'history'>('list');
  const [filter, setFilter] = useState<DerivedStatus | 'all'>('all');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<DocumentSubmission | null>(null);
  const [addTruckModalOpen, setAddTruckModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | undefined>();

  // Expiry warnings keyed by truckId. Shares the computation with
  // TruckDetailPage's Genel tab so both surfaces word warnings identically.
  const warningsByTruck = useMemo(() => {
    const todayMs = todayMidnightMs();
    const map = new Map<string, ReturnType<typeof computeTruckWarnings>>();
    for (const t of trucks) map.set(t.id, computeTruckWarnings(t, todayMs));
    return map;
  }, [trucks]);

  // Handle query param for auto-tab selection
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'pending') {
      setTab('pending');
    } else if (tabParam === 'history') {
      setTab('history');
    }
  }, [searchParams]);

  // Dashboard quick-action support: `?add=1` auto-opens the add-truck modal
  // on mount. Consumed once — the param is stripped so reloads don't re-open
  // the modal. Falls through to the plan-limit upgrade nudge when needed.
  // setSearchParams + the setState setters are all stable references; only
  // value-carrying deps belong here.
  useEffect(() => {
    if (searchParams.get('add') !== '1') return;
    if (maxTrucks !== -1 && trucks.length >= maxTrucks) {
      setUpgradeMessage(undefined);
      setUpgradeModalOpen(true);
    } else {
      setAddTruckModalOpen(true);
    }
    const next = new URLSearchParams(searchParams);
    next.delete('add');
    setSearchParams(next, { replace: true });
  }, [searchParams, maxTrucks, trucks.length, setSearchParams]);

  // Get truck document submissions
  const truckSubmissions = useMemo(() => {
    return documentSubmissions.filter((doc) => doc.relatedType === 'truck');
  }, [documentSubmissions]);

  // Pending truck doc submissions
  const pendingSubmissions = useMemo(() => {
    return truckSubmissions.filter((doc) => doc.status === 'pending');
  }, [truckSubmissions]);

  // Completed truck doc submissions (for history)
  const completedSubmissions = useMemo(() => {
    return truckSubmissions.filter(
      (doc) => doc.status === 'approved' || doc.status === 'rejected'
    );
  }, [truckSubmissions]);

  const hasUrgentWarning = (truckId: string): boolean =>
    (warningsByTruck.get(truckId) ?? []).some((w) => w.severity === 'error');

  const getTruckWarnings = (truckId: string) => warningsByTruck.get(truckId) ?? [];

  // Memoize derived status per truck to avoid repeated deriveTruckStatus calls
  const statusByTruckId = useMemo(() => {
    const map = new Map<string, DerivedStatus>();
    for (const t of trucks) map.set(t.id, deriveTruckStatus(t));
    return map;
  }, [trucks]);

  const statusCounts = useMemo<Record<DerivedStatus, number>>(() => {
    const acc: Record<DerivedStatus, number> = { ACTIVE: 0, READY: 0, MISSING_DOCS: 0 };
    for (const s of statusByTruckId.values()) acc[s]++;
    return acc;
  }, [statusByTruckId]);

  // Filter and sort trucks (warnings to the top)
  const filteredTrucks = useMemo(() => {
    let filtered = filter === 'all' ? trucks : trucks.filter((truck) => statusByTruckId.get(truck.id) === filter);

    // Sort trucks with warnings to the top
    return filtered.sort((a, b) => {
      const aHasWarning = hasUrgentWarning(a.id);
      const bHasWarning = hasUrgentWarning(b.id);

      if (aHasWarning && !bHasWarning) return -1;
      if (!aHasWarning && bHasWarning) return 1;
      return 0;
    });
  }, [filter, warningsByTruck, trucks, statusByTruckId]);

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'compulsory-insurance': t('trucksPage.compulsoryInsurance'),
      'comprehensive-insurance': t('trucksPage.comprehensiveInsurance'),
      'inspection': t('trucksPage.inspection'),
    };
    return labels[category] || category;
  };

  const getSubmissionStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: t('trucksPage.pending') },
      approved: { bg: 'bg-green-100', text: 'text-green-700', label: t('trucksPage.approved') },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', label: t('trucksPage.rejected') },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const handleReviewClick = (submission: DocumentSubmission) => {
    setSelectedSubmission(submission);
    setReviewModalOpen(true);
  };

  // Group pending submissions by doc type
  const groupedByDocType = useMemo(() => {
    const insurance = pendingSubmissions.filter(
      (doc) =>
        doc.category === 'compulsory-insurance' ||
        doc.category === 'comprehensive-insurance'
    );
    const inspection = pendingSubmissions.filter(
      (doc) => doc.category === 'inspection'
    );
    return { insurance, inspection };
  }, [pendingSubmissions]);

  // Show loading state
  if (trucksLoading) {
    return (
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-4">{t('truck.title')}</h1>
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
          {t('truck.title')}
          <span className="text-sm font-medium text-gray-400 ml-2">
            ({trucks.length}{maxTrucks !== -1 ? `/${maxTrucks}` : ''})
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
            <Download className="w-4 h-4 inline -mt-0.5" /> {t('trucksPage.import')}
          </button>
          <button
            onClick={() => {
              if (maxTrucks !== -1 && trucks.length >= maxTrucks) { setUpgradeMessage(undefined); setUpgradeModalOpen(true); }
              else setAddTruckModalOpen(true);
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all"
          >
            {t('trucksPage.addTruck')}
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
          {t('trucksPage.trucks')} ({trucks.length})
        </button>
        {completedSubmissions.length > 0 && (
          <button
            onClick={() => setTab('history')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'history'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {t('trucksPage.history')}
          </button>
        )}
        {pendingSubmissions.length > 0 && (
          <button
            onClick={() => setTab('pending')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'pending'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-orange-600 hover:text-orange-700'
            }`}
          >
            {t('trucksPage.pendingApprovals')} ({pendingSubmissions.length})
          </button>
        )}
      </div>

      {/* Truck List Tab */}
      {tab === 'list' && (
        <>
          {/* Filter chips */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {t('truck.all')} ({trucks.length})
            </button>
            <button
              onClick={() => setFilter('ACTIVE')}
              className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap ${
                filter === 'ACTIVE'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {t('derivedStatus.ACTIVE')} ({statusCounts.ACTIVE})
            </button>
            <button
              onClick={() => setFilter('READY')}
              className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap ${
                filter === 'READY'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {t('derivedStatus.READY')} ({statusCounts.READY})
            </button>
            <button
              onClick={() => setFilter('MISSING_DOCS')}
              className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap ${
                filter === 'MISSING_DOCS'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {t('derivedStatus.MISSING_DOCS')} ({statusCounts.MISSING_DOCS})
            </button>
          </div>

          {/* Truck list */}
          <div className="space-y-3">
            {filteredTrucks.length === 0 && trucks.length === 0 && (
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-10 text-center">
                <TruckIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">{t('trucksPage.emptyTitle')}</h3>
                <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
                  {t('trucksPage.emptyHint')}
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <button
                    onClick={() => {
                      if (plan === 'FREE') { setUpgradeMessage(t('bulkImport.bulkImportUpgrade')); setUpgradeModalOpen(true); }
                      else setBulkImportOpen(true);
                    }}
                    className="px-4 py-2 border border-primary-600 text-primary-600 rounded-lg text-sm font-medium hover:bg-primary-50"
                  >
                    <Download className="w-4 h-4 inline -mt-0.5" /> {t('trucksPage.excelImport')}
                  </button>
                  <button
                    onClick={() => {
                      if (maxTrucks !== -1 && trucks.length >= maxTrucks) { setUpgradeMessage(undefined); setUpgradeModalOpen(true); }
                      else setAddTruckModalOpen(true);
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700"
                  >
                    {t('trucksPage.addFirst')}
                  </button>
                </div>
              </div>
            )}
            {filteredTrucks.length === 0 && trucks.length > 0 && (
              <div className="bg-white rounded-xl p-6 text-center text-gray-500">
                {t('trucksPage.noFilterResult')}
              </div>
            )}
            {filteredTrucks.map((truck) => {
              const hasWarning = hasUrgentWarning(truck.id);
              return (
                <Link
                  key={truck.id}
                  to={`/manager/trucks/${truck.id}`}
                  className={`block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ${
                    hasWarning ? 'border-2 border-red-500' : 'border border-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{truck.plateNumber}</p>
                        <p className="text-sm text-gray-600 mt-1">{t(`truckType.${truck.type}`, { defaultValue: truck.type })}</p>
                      </div>
                      {hasUrgentWarning(truck.id) && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-md">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="text-xs font-medium text-red-700">{t('trucksPage.warningLabel')}</span>
                        </div>
                      )}
                    </div>
                    {(() => {
                      const ds = statusByTruckId.get(truck.id)!;
                      const badge = STATUS_BADGE[ds];
                      return (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${badge.bg} ${badge.text}`}>
                          {t(`derivedStatus.${ds}`)}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>
                      {t('truck.driver')}: {truck.assignedDriverName || t('trucksPage.notAssigned')}
                    </p>
                    {/* Tertiary signal: warnings below keep priority when
                        present; on healthy trucks this is the "all good" cue. */}
                    {truck.expectedLPer100KmDerived !== null && (
                      <p className="mt-1 text-xs text-gray-400 tabular-nums">
                        {formatDecimal(truck.expectedLPer100KmDerived)}{' '}
                        {t('fuelEntry.summary.avgConsumptionUnit')}{' '}
                        {t('trucksPage.consumptionSuffix')}
                      </p>
                    )}
                    {truck.lastPosition && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(
                            `https://www.google.com/maps?q=${truck.lastPosition!.lat},${truck.lastPosition!.lng}`,
                            '_blank',
                            'noopener,noreferrer'
                          );
                        }}
                        className="mt-1 inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        <MapPin className="w-3.5 h-3.5 inline -mt-0.5" /> {truck.lastPosition.city}
                        {truck.lastPosition.updatedAt && (
                          <span className="text-gray-400">
                            · {formatRelativeTime(truck.lastPosition.updatedAt)}
                          </span>
                        )}
                      </button>
                    )}
                  </div>

                  {/* Document warnings */}
                  {getTruckWarnings(truck.id).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                      {getTruckWarnings(truck.id).map((warning, index) => (
                        <div
                          key={`${truck.id}-${warning.type}-${index}`}
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
        <div className="space-y-4">
          {pendingSubmissions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">{t('trucksPage.noPendingDoc')}</p>
              <p className="text-sm text-gray-600">{t('trucksPage.allChecked')}</p>
            </div>
          ) : (
            <>
              {/* Sigorta Section */}
              {groupedByDocType.insurance.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">{t('trucksPage.insurance')}</h2>
                  <div className="space-y-3">
                    {groupedByDocType.insurance.map((submission) => (
                      <button
                        key={submission.id}
                        onClick={() => handleReviewClick(submission)}
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
                              {t('trucksPage.vehicleLabel')}: <span className="font-medium">{submission.relatedName}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {t('trucksPage.sender')}: {submission.submittedByName}
                            </p>
                          </div>
                          {getSubmissionStatusBadge(submission.status)}
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatDate(submission.submittedAt)}</span>
                          <span className="text-primary-600 font-medium">{t('trucksPage.review')} →</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Muayene Section */}
              {groupedByDocType.inspection.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">{t('trucksPage.inspection')}</h2>
                  <div className="space-y-3">
                    {groupedByDocType.inspection.map((submission) => (
                      <button
                        key={submission.id}
                        onClick={() => handleReviewClick(submission)}
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
                              {t('trucksPage.vehicleLabel')}: <span className="font-medium">{submission.relatedName}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {t('trucksPage.sender')}: {submission.submittedByName}
                            </p>
                          </div>
                          {getSubmissionStatusBadge(submission.status)}
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatDate(submission.submittedAt)}</span>
                          <span className="text-primary-600 font-medium">{t('trucksPage.review')} →</span>
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
          {completedSubmissions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <ClipboardList className="w-14 h-14 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">{t('trucksPage.noHistory')}</p>
              <p className="text-sm text-gray-600">{t('trucksPage.historyHint')}</p>
            </div>
          ) : (
            completedSubmissions.map((submission) => (
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
                      {t('trucksPage.vehicleLabel')}: <span className="font-medium">{submission.relatedName}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('trucksPage.sender')}: {submission.submittedByName}
                    </p>
                  </div>
                  {getSubmissionStatusBadge(submission.status)}
                </div>
                <div className="text-xs text-gray-500">
                  {formatDate(submission.submittedAt)}
                </div>
              </div>
            ))
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

      {/* Add Truck Modal */}
      <AddTruckModal
        isOpen={addTruckModalOpen}
        onClose={() => setAddTruckModalOpen(false)}
        onSuccess={refreshRoster}
      />

      <BulkImportModal
        isOpen={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        onSuccess={refreshRoster}
        entityType="truck"
      />

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => { setUpgradeModalOpen(false); setUpgradeMessage(undefined); }}
        resource="truck"
        currentPlan={plan}
        message={upgradeMessage}
      />
    </div>
  );
};

export default TrucksPage;
