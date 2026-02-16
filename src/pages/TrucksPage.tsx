import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { TRUCKS } from '../constants/text';
import { mockTrucks, mockDrivers } from '../data/mock';
import { useData } from '../contexts/DataContext';
import { calculateWarnings } from '../utils/warnings';
import { formatDate } from '../utils/format';
import DocumentReviewModal from '../components/common/DocumentReviewModal';
import type { TruckStatus, DocumentSubmission } from '../types';

const TrucksPage = () => {
  const { documentSubmissions } = useData();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'list' | 'pending' | 'history'>('list');
  const [filter, setFilter] = useState<TruckStatus | 'all'>('all');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<DocumentSubmission | null>(null);

  const warnings = useMemo(() => calculateWarnings(mockTrucks, mockDrivers), []);

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
    let trucks = filter === 'all' ? mockTrucks : mockTrucks.filter((truck) => truck.status === filter);

    // Sort trucks with warnings to the top
    return trucks.sort((a, b) => {
      const aHasWarning = hasUrgentWarning(a.id);
      const bHasWarning = hasUrgentWarning(b.id);

      if (aHasWarning && !bHasWarning) return -1;
      if (!aHasWarning && bHasWarning) return 1;
      return 0;
    });
  }, [filter, warnings]);

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
        return TRUCKS.available;
      case 'in-transit':
        return TRUCKS.inTransit;
      case 'maintenance':
        return TRUCKS.maintenance;
      default:
        return status;
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      'compulsory-insurance': 'Zorunlu Trafik Sigortası',
      'comprehensive-insurance': 'Kasko',
      'inspection': 'Muayene',
    };
    return labels[category] || category;
  };

  const getSubmissionStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Bekliyor' },
      approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Onaylandı' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Reddedildi' },
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

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{TRUCKS.title}</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setTab('list')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'list'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Araçlar ({mockTrucks.length})
        </button>
        <button
          onClick={() => setTab('pending')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'pending'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Onay Bekliyor ({pendingSubmissions.length})
        </button>
        <button
          onClick={() => setTab('history')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === 'history'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Geçmiş
        </button>
      </div>

      {/* Truck List Tab */}
      {tab === 'list' && (
        <>
          {/* Filter chips */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {TRUCKS.all} ({mockTrucks.length})
            </button>
            <button
              onClick={() => setFilter('available')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                filter === 'available'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {TRUCKS.available} ({mockTrucks.filter((t) => t.status === 'available').length})
            </button>
            <button
              onClick={() => setFilter('in-transit')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                filter === 'in-transit'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {TRUCKS.inTransit} ({mockTrucks.filter((t) => t.status === 'in-transit').length})
            </button>
            <button
              onClick={() => setFilter('maintenance')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                filter === 'maintenance'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {TRUCKS.maintenance} ({mockTrucks.filter((t) => t.status === 'maintenance').length})
            </button>
          </div>

          {/* Truck list */}
          <div className="space-y-3">
            {filteredTrucks.map((truck) => {
              const hasWarning = hasUrgentWarning(truck.id);
              return (
                <Link
                  key={truck.id}
                  to={`/manager/trucks/${truck.id}`}
                  className={`block bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
                    hasWarning ? 'border-2 border-red-500' : 'border border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">{truck.plateNumber}</p>
                        <p className="text-sm text-gray-600 mt-1">{truck.type}</p>
                      </div>
                      {hasUrgentWarning(truck.id) && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-200 rounded-md">
                          <span className="text-base">🚨</span>
                          <span className="text-xs font-medium text-red-700">Uyarı</span>
                        </div>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(truck.status)}`}>
                      {getStatusLabel(truck.status)}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>
                      {TRUCKS.driver}: {truck.assignedDriverName || 'Atanmadı'}
                    </p>
                    {truck.lastPosition && (
                      <p className="text-xs text-gray-500 mt-1">
                        📍 {truck.lastPosition.city}
                      </p>
                    )}
                  </div>

                  {/* Document warnings */}
                  {getTruckWarnings(truck.id).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                      {getTruckWarnings(truck.id).map((warning) => (
                        <div
                          key={warning.id}
                          className={`text-xs px-2 py-1 rounded ${
                            warning.severity === 'error'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-yellow-50 text-yellow-700'
                          }`}
                        >
                          {warning.severity === 'error' ? '🚨' : '⚠️'} {warning.message.split(' - ')[1]}
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
              <div className="text-6xl mb-4">✅</div>
              <p className="text-lg font-medium text-gray-900 mb-2">Onay bekleyen belge yok</p>
              <p className="text-sm text-gray-600">Tüm belge güncellemeleri kontrol edildi.</p>
            </div>
          ) : (
            <>
              {/* Sigorta Section */}
              {groupedByDocType.insurance.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Sigorta</h2>
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
                              <span className="text-lg">📄</span>
                              <h3 className="text-sm font-bold text-gray-900">
                                {getCategoryLabel(submission.category)}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-600">
                              Araç: <span className="font-medium">{submission.relatedName}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Gönderen: {submission.submittedByName}
                            </p>
                          </div>
                          {getSubmissionStatusBadge(submission.status)}
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatDate(submission.submittedAt)}</span>
                          <span className="text-primary-600 font-medium">İncele →</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Muayene Section */}
              {groupedByDocType.inspection.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Muayene</h2>
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
                              <span className="text-lg">📄</span>
                              <h3 className="text-sm font-bold text-gray-900">
                                {getCategoryLabel(submission.category)}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-600">
                              Araç: <span className="font-medium">{submission.relatedName}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Gönderen: {submission.submittedByName}
                            </p>
                          </div>
                          {getSubmissionStatusBadge(submission.status)}
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatDate(submission.submittedAt)}</span>
                          <span className="text-primary-600 font-medium">İncele →</span>
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
              <div className="text-6xl mb-4">📋</div>
              <p className="text-lg font-medium text-gray-900 mb-2">Geçmiş kayıt yok</p>
              <p className="text-sm text-gray-600">Onaylanan veya reddedilen belgeler burada görünecek.</p>
            </div>
          ) : (
            completedSubmissions.map((submission) => (
              <div
                key={submission.id}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 opacity-60"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">📄</span>
                      <h3 className="text-sm font-bold text-gray-900">
                        {getCategoryLabel(submission.category)}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Araç: <span className="font-medium">{submission.relatedName}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Gönderen: {submission.submittedByName}
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
    </div>
  );
};

export default TrucksPage;
