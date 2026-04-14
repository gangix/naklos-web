import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, AlertTriangle, CheckCircle, ClipboardList, Download, FileText, MapPin, Truck as TruckIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTrucks } from '../hooks/useApiData';
import { useFleet } from '../contexts/FleetContext';
import { useData } from '../contexts/DataContext';
import { formatDate, formatRelativeTime } from '../utils/format';
import DocumentReviewModal from '../components/common/DocumentReviewModal';
import AddTruckModal from '../components/common/AddTruckModal';
import BulkImportModal from '../components/common/BulkImportModal';
import UpgradeModal from '../components/common/UpgradeModal';
import type { TruckStatus, DocumentSubmission } from '../types';

const TrucksPage = () => {
  const { t } = useTranslation();
  const { data: trucks, loading: trucksLoading, refresh } = useTrucks();
  const { plan } = useFleet();
  const { documentSubmissions } = useData();
  const maxTrucks = { FREE: 5, PROFESSIONAL: 25, BUSINESS: 100, ENTERPRISE: -1 }[plan] ?? 5;
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'list' | 'pending' | 'history'>('list');
  const [filter, setFilter] = useState<TruckStatus | 'all'>('all');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<DocumentSubmission | null>(null);
  const [addTruckModalOpen, setAddTruckModalOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState<string | undefined>();

  // Calculate expiry warnings for trucks. Each warning carries an i18n key
  // + interpolation params instead of a pre-built message, so the rendered
  // text follows the active language without re-running the calculation.
  const warnings = useMemo(() => {
    const today = new Date();
    const warningsList: Array<{
      relatedId: string;
      relatedType: 'truck';
      severity: 'error' | 'warning';
      key: string;
      params: Record<string, string | number>;
      type: string;
    }> = [];

    const checkExpiry = (
      truck: typeof trucks[number],
      date: string | null,
      type: string,
      keys: { missing?: string; expired: string; expiring: string },
    ) => {
      if (!date) {
        if (keys.missing) {
          warningsList.push({
            relatedId: truck.id,
            relatedType: 'truck',
            severity: 'error',
            key: keys.missing,
            params: { plate: truck.plateNumber },
            type,
          });
        }
        return;
      }
      const days = Math.ceil((new Date(date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (days < 0) {
        warningsList.push({
          relatedId: truck.id, relatedType: 'truck', severity: 'error',
          key: keys.expired, params: { plate: truck.plateNumber }, type,
        });
      } else if (days <= 30) {
        warningsList.push({
          relatedId: truck.id, relatedType: 'truck',
          severity: days <= 7 ? 'error' : 'warning',
          key: keys.expiring, params: { plate: truck.plateNumber, count: days }, type,
        });
      }
    };

    trucks.forEach((truck) => {
      checkExpiry(truck, truck.compulsoryInsuranceExpiry, 'compulsory-insurance', {
        missing: 'warning.compulsoryInsuranceMissing',
        expired: 'warning.compulsoryInsuranceExpired',
        expiring: 'warning.compulsoryInsuranceExpiring',
      });
      checkExpiry(truck, truck.comprehensiveInsuranceExpiry, 'comprehensive-insurance', {
        // Comprehensive insurance is optional — no missing warning.
        expired: 'warning.comprehensiveInsuranceExpired',
        expiring: 'warning.comprehensiveInsuranceExpiring',
      });
      checkExpiry(truck, truck.inspectionExpiry, 'inspection', {
        missing: 'warning.inspectionMissing',
        expired: 'warning.inspectionExpired',
        expiring: 'warning.inspectionExpiring',
      });
    });

    return warningsList;
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

  // Check if a truck has any expiring documents within 7 days
  const hasUrgentWarning = (truckId: string): boolean => {
    return warnings.some(
      (w) =>
        w.relatedId === truckId &&
        w.relatedType === 'truck' &&
        w.severity === 'error'
    );
  };

  // Get all warnings for a specific truck
  const getTruckWarnings = (truckId: string) => {
    return warnings.filter(
      (w) => w.relatedId === truckId && w.relatedType === 'truck'
    );
  };

  // Filter and sort trucks (warnings to the top)
  const filteredTrucks = useMemo(() => {
    let filtered = filter === 'all' ? trucks : trucks.filter((truck) => truck.status === filter);

    // Sort trucks with warnings to the top
    return filtered.sort((a, b) => {
      const aHasWarning = hasUrgentWarning(a.id);
      const bHasWarning = hasUrgentWarning(b.id);

      if (aHasWarning && !bHasWarning) return -1;
      if (!aHasWarning && bHasWarning) return 1;
      return 0;
    });
  }, [filter, warnings, trucks]);

  const getStatusColor = (status: TruckStatus) => {
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

  const getStatusLabel = (status: TruckStatus) => {
    switch (status) {
      case 'available':
        return t('truck.available');
      case 'in-transit':
        return t('truck.inTransit');
      case 'maintenance':
        return t('truck.maintenance');
      default:
        return status;
    }
  };

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
      <div className="p-4">
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
    <div className="p-4">
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
              onClick={() => setFilter('available')}
              className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap ${
                filter === 'available'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {t('truck.available')} ({trucks.filter((t) => t.status === 'available').length})
            </button>
            <button
              onClick={() => setFilter('maintenance')}
              className={`px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap ${
                filter === 'maintenance'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {t('truck.maintenance')} ({trucks.filter((t) => t.status === 'maintenance').length})
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
              <div className="bg-white rounded-lg p-6 text-center text-gray-500">
                {t('trucksPage.noFilterResult')}
              </div>
            )}
            {filteredTrucks.map((truck) => {
              const hasWarning = hasUrgentWarning(truck.id);
              return (
                <Link
                  key={truck.id}
                  to={`/manager/trucks/${truck.id}`}
                  className={`block bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
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
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(truck.status)}`}>
                      {getStatusLabel(truck.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>
                      {t('truck.driver')}: {truck.assignedDriverName || t('trucksPage.notAssigned')}
                    </p>
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
            <div className="text-center py-12 bg-white rounded-lg">
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
                        className="w-full bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all text-left border-2 border-transparent hover:border-primary-500"
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
                        className="w-full bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all text-left border-2 border-transparent hover:border-primary-500"
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
            <div className="text-center py-12 bg-white rounded-lg">
              <ClipboardList className="w-14 h-14 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">{t('trucksPage.noHistory')}</p>
              <p className="text-sm text-gray-600">{t('trucksPage.historyHint')}</p>
            </div>
          ) : (
            completedSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 opacity-60"
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
        onSuccess={() => {
          refresh();
        }}
      />

      <BulkImportModal
        isOpen={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        onSuccess={refresh}
        entityType="truck"
      />

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => { setUpgradeModalOpen(false); setUpgradeMessage(undefined); }}
        resource={t('resource.truck')}
        currentPlan={plan}
        message={upgradeMessage}
      />
    </div>
  );
};

export default TrucksPage;
