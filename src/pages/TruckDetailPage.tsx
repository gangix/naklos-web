import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { MapPin } from 'lucide-react';
import { truckApi, driverApi } from '../services/api';
import { useFleet } from '../contexts/FleetContext';
import { useTranslation } from 'react-i18next';
import { formatDate } from '../utils/format';
import ExpiryBadge from '../components/common/ExpiryBadge';
import SimpleDocumentUpdateModal from '../components/common/SimpleDocumentUpdateModal';
import ConfirmActionModal from '../components/fuel/ConfirmActionModal';
import { Select } from '../components/common/FormField';
import { deriveTruckStatus, STATUS_BADGE } from '../utils/derivedStatus';
import type { DocumentCategory, Truck, Driver } from '../types';

const TruckDetailPage = () => {
  const { t } = useTranslation();
  const { truckId } = useParams<{ truckId: string }>();
  const navigate = useNavigate();
  const { fleetId } = useFleet();
  const [truck, setTruck] = useState<Truck | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory | null>(null);
  const [uploadCurrentExpiry, setUploadCurrentExpiry] = useState<string | null>(null);
  const [showDriverSelect, setShowDriverSelect] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assigningDriver, setAssigningDriver] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'delete' | 'unassign' | null>(null);

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

  useEffect(() => {
    if (!fleetId) return;

    const fetchDrivers = async () => {
      try {
        const page = await driverApi.getByFleet(0, 1000);
        setDrivers(page.content);
      } catch (err) {
        console.error('Error fetching drivers:', err);
      }
    };

    fetchDrivers();
  }, [fleetId]);

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
        <p className="text-center text-red-600">{error || t('truckDetail.notFound')}</p>
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
    } catch (err) {
      console.error('Error assigning driver:', err);
      toast.error(t('toast.error.assignDriver'));
    } finally {
      setAssigningDriver(false);
    }
  };

  const runUnassignDriver = async () => {
    if (!truckId) return;
    try {
      setAssigningDriver(true);
      const updatedTruck = await truckApi.unassignDriver(truckId);
      setTruck(updatedTruck);
      setConfirmAction(null);
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

    const updateData: any = {};

    if (category === 'compulsory-insurance') {
      updateData.compulsoryInsuranceExpiry = expiryDate;
    } else if (category === 'comprehensive-insurance') {
      updateData.comprehensiveInsuranceExpiry = expiryDate;
    } else if (category === 'inspection') {
      updateData.inspectionExpiry = expiryDate;
    }

    await truckApi.updateDocuments(truckId, updateData);

    // Refresh truck data
    const updatedTruck = await truckApi.getById(truckId);
    setTruck(updatedTruck);
  };

  const runDeleteTruck = async () => {
    if (!truckId) return;
    try {
      await truckApi.delete(truckId);
      setConfirmAction(null);
      navigate('/manager/trucks');
    } catch (err) {
      console.error('Error deleting truck:', err);
      toast.error(t('toast.error.deleteTruck'));
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
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">{truck.plateNumber}</h1>
          <p className="text-sm text-gray-600 mt-1">{truck.type}</p>
        </div>
      </div>

      {/* Basic info card */}
      <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">{t('truck.basicInfo')}</h2>
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
                    onClick={() => setConfirmAction('unassign')}
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
                    <div className="flex items-center gap-2">
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
                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.firstName} {driver.lastName}
                          </option>
                        ))}
                      </Select>
                      <button
                        onClick={() => setShowDriverSelect(false)}
                        className="text-xs text-gray-600 hover:text-gray-700"
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

      {/* Document expiry section */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">{t('truck.documents')}</h2>
        <div className="space-y-3">
          {/* Compulsory Insurance */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-900">{t('truck.compulsoryInsurance')}</h3>
              <button
                onClick={() => handleDocumentUpdate('compulsory-insurance', truck.compulsoryInsuranceExpiry)}
                className="text-sm text-primary-600 font-medium"
              >
                {t('common.update')}
              </button>
            </div>
            <ExpiryBadge
              label=""
              date={truck.compulsoryInsuranceExpiry}
            />
          </div>

          {/* Comprehensive Insurance */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-900">{t('truck.comprehensiveInsurance')}</h3>
              <button
                onClick={() => handleDocumentUpdate('comprehensive-insurance', truck.comprehensiveInsuranceExpiry)}
                className="text-sm text-primary-600 font-medium"
              >
                {t('common.update')}
              </button>
            </div>
            <ExpiryBadge
              label=""
              date={truck.comprehensiveInsuranceExpiry}
            />
          </div>

          {/* Inspection */}
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-900">{t('truck.inspection')}</h3>
              <button
                onClick={() => handleDocumentUpdate('inspection', truck.inspectionExpiry)}
                className="text-sm text-primary-600 font-medium"
              >
                {t('common.update')}
              </button>
            </div>
            <ExpiryBadge
              label=""
              date={truck.inspectionExpiry}
            />
          </div>
        </div>
      </div>

      {/* Document upload history (audit trail) */}
      {documents.length > 0 && (
        <div className="mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">{t('truckDetail.documentHistory')}</h2>
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

      {/* Location card */}
      {truck.lastPosition && (
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">{t('truck.location')}</h2>
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

      {/* Performance metrics — hidden until trip + fuel modules ship.
          Restoring this needs both: trip data populates revenue/tripCount,
          fuel data feeds utilization. */}

      {/* Delete truck */}
      <div className="mt-6">
        <button
          onClick={() => setConfirmAction('delete')}
          className="w-full py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors"
        >
          {t('truckDetail.deleteTruck')}
        </button>
      </div>

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
          bullets={[t('common.irreversible')]}
          confirmLabel={t('common.delete')}
          tone="danger"
          onConfirm={runDeleteTruck}
          onClose={() => setConfirmAction(null)}
        />
      )}

      {confirmAction === 'unassign' && (
        <ConfirmActionModal
          title={t('confirmDelete.unassignDriver.title')}
          description={t('confirmDelete.unassignDriver.description')}
          bullets={[t('common.irreversible')]}
          confirmLabel={t('common.remove')}
          tone="danger"
          onConfirm={runUnassignDriver}
          onClose={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
};

export default TruckDetailPage;
