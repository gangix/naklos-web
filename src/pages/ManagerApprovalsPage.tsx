import { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { APPROVALS } from '../constants/text';
import { formatDate } from '../utils/format';
import DocumentReviewModal from '../components/common/DocumentReviewModal';
import TruckAssignmentModal from '../components/common/TruckAssignmentModal';
import type { DocumentSubmission, TruckAssignmentRequest } from '../types';

type ApprovalItemType = 'document' | 'truck_request';

interface ApprovalItem {
  id: string;
  type: ApprovalItemType;
  submitterName: string;
  submittedAt: string;
  status: string;
  category?: string; // for documents
  relatedName?: string; // driver name or truck plate
  preferredTruckPlate?: string; // for truck requests
}

const ManagerApprovalsPage = () => {
  const { documentSubmissions, truckAssignmentRequests } = useData();
  const [selectedTab, setSelectedTab] = useState<'all' | 'documents' | 'trucks'>('all');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<DocumentSubmission | null>(null);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TruckAssignmentRequest | null>(null);

  // Combine all approval items
  const allItems: ApprovalItem[] = [
    ...documentSubmissions.map((doc) => ({
      id: doc.id,
      type: 'document' as const,
      submitterName: doc.submittedByName,
      submittedAt: doc.submittedAt,
      status: doc.status,
      category: doc.category,
      relatedName: doc.relatedName,
    })),
    ...truckAssignmentRequests.map((req) => ({
      id: req.id,
      type: 'truck_request' as const,
      submitterName: req.driverName,
      submittedAt: req.requestedAt,
      status: req.status,
      preferredTruckPlate: req.preferredTruckPlate,
    })),
  ];

  // Filter items
  const filteredItems = allItems
    .filter((item) => {
      if (selectedTab === 'documents') return item.type === 'document';
      if (selectedTab === 'trucks') return item.type === 'truck_request';
      return true; // 'all'
    })
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const pendingCount = allItems.filter((item) => item.status === 'pending').length;
  const pendingDocsCount = documentSubmissions.filter((doc) => doc.status === 'pending').length;
  const pendingTrucksCount = truckAssignmentRequests.filter((req) => req.status === 'pending').length;

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      license: 'Ehliyet',
      src: 'SRC Belgesi',
      cpc: 'CPC Belgesi',
      'compulsory-insurance': 'Zorunlu Trafik Sigortası',
      'comprehensive-insurance': 'Kasko',
      inspection: 'Muayene',
    };
    return labels[category] || category;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: APPROVALS.pending },
      approved: { bg: 'bg-green-100', text: 'text-green-700', label: APPROVALS.approved },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', label: APPROVALS.rejected },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  const handleItemClick = (item: ApprovalItem) => {
    if (item.status !== 'pending') return; // Only pending items are clickable

    if (item.type === 'document') {
      const submission = documentSubmissions.find((sub) => sub.id === item.id);
      if (submission) {
        setSelectedSubmission(submission);
        setReviewModalOpen(true);
      }
    } else {
      const request = truckAssignmentRequests.find((req) => req.id === item.id);
      if (request) {
        setSelectedRequest(request);
        setAssignmentModalOpen(true);
      }
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{APPROVALS.title}</h1>
        <p className="text-sm text-gray-600 mt-1">
          {pendingCount} {APPROVALS.pendingCount}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setSelectedTab('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            selectedTab === 'all'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Tümü ({allItems.length})
        </button>
        <button
          onClick={() => setSelectedTab('documents')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            selectedTab === 'documents'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Belgeler ({documentSubmissions.length})
          {pendingDocsCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
              {pendingDocsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setSelectedTab('trucks')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            selectedTab === 'trucks'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Araç Talepleri ({truckAssignmentRequests.length})
          {pendingTrucksCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
              {pendingTrucksCount}
            </span>
          )}
        </button>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <p className="text-lg font-medium text-gray-900 mb-2">{APPROVALS.noPendingApprovals}</p>
          <p className="text-sm text-gray-600">Yeni onay talebi geldiğinde burada görünecek.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              disabled={item.status !== 'pending'}
              className={`w-full bg-white rounded-lg p-4 shadow-sm text-left transition-all ${
                item.status === 'pending'
                  ? 'hover:shadow-md cursor-pointer border-2 border-transparent hover:border-primary-500'
                  : 'opacity-60 cursor-default border border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">
                      {item.type === 'document' ? '📄' : '🚛'}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900">
                      {item.type === 'document'
                        ? getCategoryLabel(item.category!)
                        : APPROVALS.truckRequest}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600">
                    {APPROVALS.submittedBy}: <span className="font-medium">{item.submitterName}</span>
                  </p>
                  {item.type === 'document' && item.relatedName && (
                    <p className="text-xs text-gray-500 mt-1">
                      {item.category?.includes('insurance') || item.category === 'inspection'
                        ? `Araç: ${item.relatedName}`
                        : `Sürücü: ${item.relatedName}`}
                    </p>
                  )}
                  {item.type === 'truck_request' && item.preferredTruckPlate && (
                    <p className="text-xs text-gray-500 mt-1">
                      Tercih: {item.preferredTruckPlate}
                    </p>
                  )}
                </div>
                {getStatusBadge(item.status)}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatDate(item.submittedAt)}</span>
                {item.status === 'pending' && (
                  <span className="text-primary-600 font-medium">{APPROVALS.review} →</span>
                )}
              </div>
            </button>
          ))}
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

export default ManagerApprovalsPage;
