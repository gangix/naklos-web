import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { TRIPS, EXPENSES, DOCUMENTS } from '../constants/text';
import { formatCurrency, formatDate } from '../utils/format';
import FileUpload from '../components/common/FileUpload';
import { mockDrivers, mockTrucks, mockClients } from '../data/mock';
import type { Document } from '../types';

const TripDetailPage = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const { trips, invoices, updateTrip } = useData();

  const trip = trips.find((t) => t.id === tripId);
  const [documents, setDocuments] = useState<Document[]>(trip?.deliveryDocuments || []);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    clientId: trip?.clientId || null,
    clientName: trip?.clientName || '',
    driverId: trip?.driverId || null,
    driverName: trip?.driverName || '',
    truckId: trip?.truckId || null,
    truckPlate: trip?.truckPlate || '',
    cargoDescription: trip?.cargoDescription || '',
    revenue: trip?.revenue || 0,
    expenses: {
      fuel: trip?.expenses.fuel || 0,
      tolls: trip?.expenses.tolls || 0,
      driverFee: trip?.expenses.driverFee || 0,
      other: trip?.expenses.other || 0,
      otherReason: trip?.expenses.otherReason || '',
    },
  });

  // Sync with context when trip changes
  useEffect(() => {
    if (trip) {
      setDocuments(trip.deliveryDocuments);
      setEditForm({
        clientId: trip.clientId || null,
        clientName: trip.clientName || '',
        driverId: trip.driverId || null,
        driverName: trip.driverName || '',
        truckId: trip.truckId || null,
        truckPlate: trip.truckPlate || '',
        cargoDescription: trip.cargoDescription || '',
        revenue: trip.revenue || 0,
        expenses: {
          fuel: trip.expenses.fuel || 0,
          tolls: trip.expenses.tolls || 0,
          driverFee: trip.expenses.driverFee || 0,
          other: trip.expenses.other || 0,
          otherReason: trip.expenses.otherReason || '',
        },
      });
    }
  }, [trip]);

  // Check if invoice already exists for this trip
  const existingInvoice = invoices.find((inv) => inv.tripIds.includes(tripId || ''));

  if (!trip) {
    return (
      <div className="p-4">
        <p className="text-center text-gray-600">Sefer bulunamadı</p>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'created':
        return 'bg-gray-100 text-gray-700';
      case 'in-progress':
        return 'bg-blue-100 text-blue-700';
      case 'delivered':
        return 'bg-orange-100 text-orange-700';
      case 'approved':
        return 'bg-emerald-100 text-emerald-700';
      case 'invoiced':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'created':
        return 'Oluşturuldu';
      case 'in-progress':
        return 'Devam Ediyor';
      case 'delivered':
        return 'Onay Bekliyor';
      case 'approved':
        return 'Onaylandı';
      case 'invoiced':
        return 'Faturalandı';
      default:
        return status;
    }
  };

  const totalExpenses =
    editForm.expenses.fuel +
    editForm.expenses.tolls +
    editForm.expenses.other;

  const netProfit = (editForm.revenue || 0) - totalExpenses;

  const handleFileSelect = (document: Document) => {
    if (documents.length >= 3) {
      alert(DOCUMENTS.maxLimit);
      return;
    }
    setDocuments([...documents, document]);
  };

  const handleSave = () => {
    if (!trip) return;

    // Find selected driver and truck details
    const selectedDriver = mockDrivers.find((d) => d.id === editForm.driverId);
    const selectedTruck = mockTrucks.find((t) => t.id === editForm.truckId);
    const selectedClient = mockClients.find((c) => c.id === editForm.clientId);

    const updates = {
      clientId: editForm.clientId,
      clientName: selectedClient?.companyName || editForm.clientName,
      driverId: editForm.driverId,
      driverName: selectedDriver ? `${selectedDriver.firstName} ${selectedDriver.lastName}` : editForm.driverName,
      truckId: editForm.truckId,
      truckPlate: selectedTruck?.plateNumber || editForm.truckPlate,
      cargoDescription: editForm.cargoDescription,
      revenue: editForm.revenue,
      expenses: editForm.expenses,
    };

    updateTrip(trip.id, updates);

    setIsEditing(false);
    alert('✓ Sefer bilgileri güncellendi');
  };

  const handleCancel = () => {
    // Reset form to original trip data
    if (trip) {
      setEditForm({
        clientId: trip.clientId || null,
        clientName: trip.clientName || '',
        driverId: trip.driverId || null,
        driverName: trip.driverName || '',
        truckId: trip.truckId || null,
        truckPlate: trip.truckPlate || '',
        cargoDescription: trip.cargoDescription || '',
        revenue: trip.revenue || 0,
        expenses: {
          fuel: trip.expenses.fuel || 0,
          tolls: trip.expenses.tolls || 0,
          driverFee: trip.expenses.driverFee || 0,
          other: trip.expenses.other || 0,
          otherReason: trip.expenses.otherReason || '',
        },
      });
    }
    setIsEditing(false);
  };

  const handleApprove = () => {
    if (!trip) return;

    // Validation: Check required fields
    const missingFields: string[] = [];
    if (!editForm.clientId) missingFields.push('Müşteri');
    if (!editForm.driverId) missingFields.push('Sürücü');
    if (!editForm.truckId) missingFields.push('Araç');
    if (!editForm.cargoDescription) missingFields.push('Kargo Tanımı');
    if (!editForm.revenue || editForm.revenue <= 0) missingFields.push('Gelir');

    if (missingFields.length > 0) {
      alert(
        `⚠️ Onaylamadan önce aşağıdaki bilgileri doldurmanız gerekiyor:\n\n${missingFields.join('\n')}\n\nLütfen "Düzenle" butonuna basıp eksik bilgileri tamamlayın.`
      );
      return;
    }

    if (documents.length === 0) {
      alert('⚠️ Onaylamadan önce teslimat belgesi yüklemeniz gerekiyor.');
      return;
    }

    const confirmed = window.confirm(
      `Bu seferi onaylamak istediğinizden emin misiniz?\n\nMüşteri: ${editForm.clientName}\nGelir: ${formatCurrency(editForm.revenue || 0)}\n\nOnaylandıktan sonra "Fatura Hazır" sekmesine taşınacak.`
    );

    if (confirmed) {
      updateTrip(trip.id, {
        status: 'approved',
        approvedByManager: true,
        approvedAt: new Date().toISOString(),
        deliveryDocuments: documents,
      });
      alert('✓ Sefer onaylandı! Artık faturalandırabilirsiniz.');
      navigate('/manager/trips');
    }
  };

  const handleClientChange = (clientId: string) => {
    const client = mockClients.find((c) => c.id === clientId);
    if (client) {
      setEditForm({
        ...editForm,
        clientId: client.id,
        clientName: client.companyName,
      });
    }
  };

  const handleDriverChange = (driverId: string) => {
    const driver = mockDrivers.find((d) => d.id === driverId);
    if (driver) {
      setEditForm({
        ...editForm,
        driverId: driver.id,
        driverName: `${driver.firstName} ${driver.lastName}`,
      });
    }
  };

  const handleTruckChange = (truckId: string) => {
    const truck = mockTrucks.find((t) => t.id === truckId);
    if (truck) {
      setEditForm({
        ...editForm,
        truckId: truck.id,
        truckPlate: truck.plateNumber,
      });
    }
  };

  const handleDocumentClick = (doc: Document) => {
    setSelectedDocument(doc);
  };

  const closeModal = () => {
    setSelectedDocument(null);
  };

  const canApprove =
    trip.status === 'delivered' &&
    documents.length > 0;

  return (
    <div className="p-4 pb-20">
      {/* Header with back button and edit/approve actions */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-2xl text-gray-600 hover:text-gray-900 transition-colors"
        >
          ←
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">
            {trip.originCity} → {trip.destinationCity}
          </h1>
          <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
            {getStatusLabel(trip.status)}
          </span>
        </div>
        {!isEditing && trip.status !== 'invoiced' && (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            ✏️ Düzenle
          </button>
        )}
      </div>

      {/* Edit mode save/cancel buttons */}
      {isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex gap-2">
          <button
            onClick={handleSave}
            className="flex-1 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            ✓ Kaydet
          </button>
          <button
            onClick={handleCancel}
            className="flex-1 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            ✕ İptal
          </button>
        </div>
      )}

      {/* Trip info card */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">{TRIPS.tripInfo}</h2>
        <div className="space-y-3">
          {/* Client */}
          <div>
            <label className="text-sm text-gray-600 block mb-1">{TRIPS.client}</label>
            {isEditing ? (
              <select
                value={editForm.clientId || ''}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Müşteri Seçin</option>
                {mockClients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.companyName}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-sm font-medium text-gray-900">{editForm.clientName || 'Belirtilmemiş'}</span>
            )}
          </div>

          {/* Truck */}
          <div>
            <label className="text-sm text-gray-600 block mb-1">{TRIPS.truck}</label>
            {isEditing ? (
              <select
                value={editForm.truckId || ''}
                onChange={(e) => handleTruckChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Araç Seçin</option>
                {mockTrucks
                  .filter((truck) => truck.status === 'available' || truck.id === editForm.truckId)
                  .map((truck) => (
                    <option key={truck.id} value={truck.id}>
                      {truck.plateNumber} - {truck.type}
                    </option>
                  ))}
              </select>
            ) : (
              <span className="text-sm font-medium text-gray-900">{editForm.truckPlate || 'Belirtilmemiş'}</span>
            )}
          </div>

          {/* Driver */}
          <div>
            <label className="text-sm text-gray-600 block mb-1">{TRIPS.driver}</label>
            {isEditing ? (
              <select
                value={editForm.driverId || ''}
                onChange={(e) => handleDriverChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sürücü Seçin</option>
                {mockDrivers
                  .filter((driver) => driver.status === 'available' || driver.id === editForm.driverId)
                  .map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.firstName} {driver.lastName} - {driver.phone}
                    </option>
                  ))}
              </select>
            ) : (
              <span className="text-sm font-medium text-gray-900">{editForm.driverName || 'Belirtilmemiş'}</span>
            )}
          </div>

          {/* Cargo Description */}
          <div>
            <label className="text-sm text-gray-600 block mb-1">Kargo Tanımı</label>
            {isEditing ? (
              <input
                type="text"
                value={editForm.cargoDescription || ''}
                onChange={(e) => setEditForm({ ...editForm, cargoDescription: e.target.value })}
                placeholder="Örn: İnşaat Malzemesi, 15 ton"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <span className="text-sm font-medium text-gray-900">{editForm.cargoDescription || 'Belirtilmemiş'}</span>
            )}
          </div>

          {/* Driver Entered Destination (if POD-first trip) */}
          {trip.driverEnteredDestination && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-xs text-orange-700 mb-1">Sürücünün Girdiği Hedef:</p>
              <p className="text-sm font-medium text-orange-900">{trip.driverEnteredDestination}</p>
            </div>
          )}
        </div>
      </div>

      {/* Financial summary (Mali Bilgiler) */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">Mali Bilgiler</h2>
        <div className="space-y-3">
          {/* Revenue */}
          <div className="pb-2 border-b border-gray-100">
            <label className="text-sm text-gray-600 block mb-1">{TRIPS.revenue}</label>
            {isEditing ? (
              <input
                type="number"
                value={editForm.revenue || 0}
                onChange={(e) => setEditForm({ ...editForm, revenue: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-bold text-green-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            ) : (
              <span className="text-sm font-bold text-green-600">{formatCurrency(editForm.revenue || 0)}</span>
            )}
          </div>

          {/* Expenses */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Giderler</p>

            <div className="space-y-2 pl-3">
              {/* Fuel */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">{EXPENSES.fuel}</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editForm.expenses.fuel}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        expenses: { ...editForm.expenses, fuel: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                  />
                ) : (
                  <span className="text-sm text-gray-600">{formatCurrency(editForm.expenses.fuel)}</span>
                )}
              </div>

              {/* Tolls */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">{EXPENSES.tolls}</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editForm.expenses.tolls}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        expenses: { ...editForm.expenses, tolls: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                  />
                ) : (
                  <span className="text-sm text-gray-600">{formatCurrency(editForm.expenses.tolls)}</span>
                )}
              </div>

              {/* Other */}
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-600">{EXPENSES.other}</label>
                {isEditing ? (
                  <input
                    type="number"
                    value={editForm.expenses.other}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        expenses: { ...editForm.expenses, other: parseFloat(e.target.value) || 0 },
                      })
                    }
                    className="w-32 px-2 py-1 border border-gray-300 rounded text-sm text-right"
                  />
                ) : (
                  <span className="text-sm text-gray-600">{formatCurrency(editForm.expenses.other)}</span>
                )}
              </div>

              {/* Other Reason - only show if other expense > 0 */}
              {(isEditing && editForm.expenses.other > 0) || (!isEditing && editForm.expenses.other > 0 && editForm.expenses.otherReason) ? (
                <div className="mt-2">
                  <label className="text-xs text-gray-600 block mb-1">Açıklama:</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editForm.expenses.otherReason || ''}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          expenses: { ...editForm.expenses, otherReason: e.target.value },
                        })
                      }
                      placeholder="Diğer gider açıklaması"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <span className="text-sm text-gray-700">{editForm.expenses.otherReason}</span>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* Net Profit */}
          <div className="flex items-center justify-between py-2 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-900">{TRIPS.netProfit}</span>
            <span className={`text-sm font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(netProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">{TRIPS.timeline}</h2>
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-600 mb-1">{TRIPS.created}</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(trip.createdAt)}</p>
          </div>
          {trip.deliveredAt && (
            <div>
              <p className="text-xs text-gray-600 mb-1">Teslim Edildi</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(trip.deliveredAt)}</p>
            </div>
          )}
          {trip.approvedAt && (
            <div>
              <p className="text-xs text-gray-600 mb-1">Onaylandı</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(trip.approvedAt)}</p>
            </div>
          )}
          {!trip.deliveredAt && trip.estimatedArrival && (
            <div>
              <p className="text-xs text-gray-600 mb-1">{TRIPS.estimated}</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(trip.estimatedArrival)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delivery documents section */}
      {(trip.status === 'in-progress' || trip.status === 'delivered' || trip.status === 'approved') && (
        <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-3">{DOCUMENTS.deliveryConfirmation}</h2>

          {/* Uploaded documents grid */}
          {documents.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mb-4">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleDocumentClick(doc)}
                  className="aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-primary-500 transition-colors"
                >
                  <img
                    src={doc.dataUrl}
                    alt={doc.name}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {documents.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4 mb-4">
              {DOCUMENTS.noDocuments}
            </p>
          )}

          {/* Upload button - only show if less than 3 documents and not approved yet */}
          {documents.length < 3 && trip.status !== 'approved' && (
            <FileUpload onFileSelect={handleFileSelect} />
          )}

          {documents.length >= 3 && (
            <p className="text-xs text-center text-gray-500 mt-3">
              {DOCUMENTS.maxLimit}
            </p>
          )}
        </div>
      )}

      {/* Approve Button for pending trips */}
      {canApprove && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 mb-4">
          <h2 className="text-lg font-bold text-orange-900 mb-2">Onay Bekliyor</h2>
          <p className="text-sm text-orange-700 mb-3">
            Bu sefer teslimat belgeleriyle birlikte onayınızı bekliyor. Detayları kontrol edip onaylayın.
          </p>
          <button
            onClick={handleApprove}
            className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 active:bg-green-800 transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-lg">✓</span>
            <span>Onayla ve Faturalandırmaya Hazırla</span>
          </button>
        </div>
      )}

      {/* Invoice section for approved trips */}
      {trip.status === 'approved' && !existingInvoice && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <h2 className="text-lg font-bold text-green-900 mb-2">✓ Onaylandı</h2>
          <p className="text-sm text-green-700 mb-3">
            Bu sefer onaylandı ve faturalandırmaya hazır.
          </p>
          <button
            onClick={() => navigate('/manager/trips')}
            className="w-full py-3 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Seferler Sayfasına Dön
          </button>
        </div>
      )}

      {/* Invoice exists */}
      {existingInvoice && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h2 className="text-lg font-bold text-purple-900 mb-2">Faturalandı</h2>
          <p className="text-sm text-purple-700 mb-3">
            Bu sefer için fatura oluşturulmuş.
          </p>
          <button
            onClick={() => navigate(`/invoices/${existingInvoice.id}`)}
            className="text-sm text-purple-700 font-medium underline"
          >
            Faturayı Görüntüle →
          </button>
        </div>
      )}

      {/* Full-size image modal */}
      {selectedDocument && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={closeModal}
              className="absolute top-2 right-2 w-10 h-10 bg-white rounded-full flex items-center justify-center text-xl font-bold text-gray-900 hover:bg-gray-100 transition-colors"
            >
              ×
            </button>
            <img
              src={selectedDocument.dataUrl}
              alt={selectedDocument.name}
              className="max-w-full max-h-[80vh] rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="bg-white p-3 rounded-lg mt-2">
              <p className="text-sm font-medium text-gray-900">{selectedDocument.name}</p>
              <p className="text-xs text-gray-500">{formatDate(selectedDocument.uploadedAt)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDetailPage;
