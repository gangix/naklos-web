import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DRIVERS } from '../constants/text';
import { mockDrivers, mockTrucks } from '../data/mock';
import { useData } from '../contexts/DataContext';
import { calculateWarnings } from '../utils/warnings';
import { formatDate } from '../utils/format';
import DocumentReviewModal from '../components/common/DocumentReviewModal';
import TruckAssignmentModal from '../components/common/TruckAssignmentModal';
import type { DriverStatus, DocumentSubmission, TruckAssignmentRequest } from '../types';

const DriversPage = () => {
  const { documentSubmissions, truckAssignmentRequests } = useData();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState<'list' | 'pending' | 'history'>('list');
  const [filter, setFilter] = useState<DriverStatus | 'all'>('all');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<DocumentSubmission | null>(null);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TruckAssignmentRequest | null>(null);

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

  // Check if a driver has any expiring documents within 7 days
  const hasUrgentWarning = (driverId: string): boolean => {
    return warnings.some(
      (w) =>
        w.relatedId === driverId &&
        w.relatedType === 'driver' &&
        w.severity === 'error'
    );
  };

  // Get all warnings for a specific driver
  const getDriverWarnings = (driverId: string) => {
    return warnings.filter(
      (w) => w.relatedId === driverId && w.relatedType === 'driver'
    );
  };

  // Filter and sort drivers (warnings to the top)
  const filteredDrivers = useMemo(() => {
    let drivers = filter === 'all' ? mockDrivers : mockDrivers.filter((driver) => driver.status === filter);

    // Sort drivers with warnings to the top
    return drivers.sort((a, b) => {
      const aHasWarning = hasUrgentWarning(a.id);
      const bHasWarning = hasUrgentWarning(b.id);

      if (aHasWarning && !bHasWarning) return -1;
      if (!aHasWarning && bHasWarning) return 1;
      return 0;
    });
  }, [filter, warnings]);

  const getStatusColor = (status: DriverStatus) => {
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

  const getStatusLabel = (status: DriverStatus) => {
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

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      license: 'Ehliyet',
      src: 'SRC Belgesi',
      cpc: 'CPC Belgesi',
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

  const handleDocReviewClick = (submission: DocumentSubmission) => {
    setSelectedSubmission(submission);
    setReviewModalOpen(true);
  };

  const handleTruckRequestClick = (request: TruckAssignmentRequest) => {
    setSelectedRequest(request);
    setAssignmentModalOpen(true);
  };

  const totalPending = pendingDocSubmissions.length + pendingTruckRequests.length;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{DRIVERS.title}</h1>

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
          Sürücüler ({mockDrivers.length})
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
            Geçmiş
          </button>
        )}
        {/* Spacer to push pending tab to the right */}
        <div className="flex-1"></div>
        {totalPending > 0 && (
          <button
            onClick={() => setTab('pending')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === 'pending'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-orange-600 hover:text-orange-700'
            }`}
          >
            Onay Bekliyor ({totalPending})
          </button>
        )}
      </div>

      {/* Driver List Tab */}
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
              {DRIVERS.all} ({mockDrivers.length})
            </button>
            <button
              onClick={() => setFilter('available')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                filter === 'available'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {DRIVERS.available} ({mockDrivers.filter((d) => d.status === 'available').length})
            </button>
            <button
              onClick={() => setFilter('on-trip')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                filter === 'on-trip'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {DRIVERS.onTrip} ({mockDrivers.filter((d) => d.status === 'on-trip').length})
            </button>
            <button
              onClick={() => setFilter('off-duty')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                filter === 'off-duty'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              {DRIVERS.offDuty} ({mockDrivers.filter((d) => d.status === 'off-duty').length})
            </button>
          </div>

          {/* Driver list */}
          <div className="space-y-3">
            {filteredDrivers.map((driver) => {
              const hasWarning = hasUrgentWarning(driver.id);
              return (
                <Link
                  key={driver.id}
                  to={`/manager/drivers/${driver.id}`}
                  className={`block bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
                    hasWarning ? 'border-2 border-red-500' : 'border border-gray-200'
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
                          <span className="text-base">🚨</span>
                          <span className="text-xs font-medium text-red-700">Uyarı</span>
                        </div>
                      )}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(driver.status)}`}>
                      {getStatusLabel(driver.status)}
                    </span>
                  </div>
                  {driver.assignedTruckPlate && (
                    <div className="text-sm text-gray-600">
                      <p>
                        {DRIVERS.assignedTruck}: {driver.assignedTruckPlate}
                      </p>
                    </div>
                  )}

                  {/* License & Certificate warnings */}
                  {getDriverWarnings(driver.id).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                      {getDriverWarnings(driver.id).map((warning) => (
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
        <div className="space-y-6">
          {totalPending === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <div className="text-6xl mb-4">✅</div>
              <p className="text-lg font-medium text-gray-900 mb-2">Onay bekleyen öğe yok</p>
              <p className="text-sm text-gray-600">Tüm talepler işlendi.</p>
            </div>
          ) : (
            <>
              {/* Belge Onayları Section */}
              {pendingDocSubmissions.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Belge Onayları</h2>
                  <div className="space-y-3">
                    {pendingDocSubmissions.map((submission) => (
                      <button
                        key={submission.id}
                        onClick={() => handleDocReviewClick(submission)}
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
                              Sürücü: <span className="font-medium">{submission.relatedName}</span>
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

              {/* Araç Talepleri Section */}
              {pendingTruckRequests.length > 0 && (
                <div>
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Araç Talepleri</h2>
                  <div className="space-y-3">
                    {pendingTruckRequests.map((request) => (
                      <button
                        key={request.id}
                        onClick={() => handleTruckRequestClick(request)}
                        className="w-full bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all text-left border-2 border-transparent hover:border-primary-500"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">🚛</span>
                              <h3 className="text-sm font-bold text-gray-900">Araç Talebi</h3>
                            </div>
                            <p className="text-sm text-gray-600">
                              Sürücü: <span className="font-medium">{request.driverName}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Tercih: {request.preferredTruckPlate}
                            </p>
                          </div>
                          {getSubmissionStatusBadge(request.status)}
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{formatDate(request.requestedAt)}</span>
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
          {completedDocSubmissions.length === 0 && completedTruckRequests.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <div className="text-6xl mb-4">📋</div>
              <p className="text-lg font-medium text-gray-900 mb-2">Geçmiş kayıt yok</p>
              <p className="text-sm text-gray-600">İşlenen belgeler ve talepler burada görünecek.</p>
            </div>
          ) : (
            <>
              {completedDocSubmissions.map((submission) => (
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
                        Sürücü: <span className="font-medium">{submission.relatedName}</span>
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
              ))}
              {completedTruckRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 opacity-60"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">🚛</span>
                        <h3 className="text-sm font-bold text-gray-900">Araç Talebi</h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        Sürücü: <span className="font-medium">{request.driverName}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Tercih: {request.preferredTruckPlate}
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
    </div>
  );
};

export default DriversPage;
