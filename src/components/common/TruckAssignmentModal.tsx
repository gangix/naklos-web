import { useState } from 'react';
import { useData } from '../../contexts/DataContext';
import { TRUCK_REQUEST, APPROVALS, COMMON } from '../../constants/text';
import { mockTrucks } from '../../data/mock';
import type { TruckAssignmentRequest } from '../../types';

interface TruckAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: TruckAssignmentRequest;
}

const TruckAssignmentModal = ({ isOpen, onClose, request }: TruckAssignmentModalProps) => {
  const { approveTruckRequest, rejectTruckRequest } = useData();
  const [isRejecting, setIsRejecting] = useState(false);
  const [selectedTruckId, setSelectedTruckId] = useState(request.preferredTruckId);
  const [rejectionNote, setRejectionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Get available trucks (no driver assigned)
  const availableTrucks = mockTrucks.filter((t) => !t.assignedDriverId);
  const preferredTruck = mockTrucks.find((t) => t.id === request.preferredTruckId);
  const selectedTruck = mockTrucks.find((t) => t.id === selectedTruckId);

  const handleApprove = async () => {
    if (!selectedTruckId || !selectedTruck) {
      alert('Lütfen bir araç seçin');
      return;
    }

    setIsSubmitting(true);
    try {
      approveTruckRequest(request.id, selectedTruckId, selectedTruck.plateNumber);
      alert(`✓ ${request.driverName} sürücüsüne ${selectedTruck.plateNumber} aracı atandı`);
      onClose();
    } catch (error) {
      alert('❌ Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionNote.trim()) {
      alert('Lütfen red nedeni girin');
      return;
    }

    setIsSubmitting(true);
    try {
      rejectTruckRequest(request.id, rejectionNote);
      alert('✓ Araç talebi reddedildi');
      onClose();
    } catch (error) {
      alert('❌ Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{TRUCK_REQUEST.title}</h2>
            <p className="text-sm text-gray-600 mt-1">{request.driverName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {!isRejecting ? (
            <>
              {/* Preferred Truck Info */}
              {preferredTruck && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                  <h3 className="text-sm font-bold text-blue-900 mb-2">
                    {TRUCK_REQUEST.preferredTruck}
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-blue-700">Plaka</p>
                      <p className="text-lg font-bold text-blue-900">{preferredTruck.plateNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700">Araç Tipi</p>
                      <p className="text-sm font-medium text-blue-900">{preferredTruck.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-700">Durum</p>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        preferredTruck.status === 'available'
                          ? 'bg-green-100 text-green-700'
                          : preferredTruck.status === 'in-transit'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {preferredTruck.status === 'available' ? 'Müsait' :
                         preferredTruck.status === 'in-transit' ? 'Yolda' : 'Bakımda'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Truck Selection */}
              <div className="mb-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">
                  Atanacak Aracı Seçin
                </h3>
                <p className="text-xs text-gray-600 mb-3">
                  Sürücünün tercih ettiği aracı onaylayabilir veya farklı bir araç atayabilirsiniz.
                </p>

                {availableTrucks.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <p className="text-sm text-gray-600">{TRUCK_REQUEST.noAvailable}</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableTrucks.map((truck) => (
                      <label
                        key={truck.id}
                        className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedTruckId === truck.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="truckSelection"
                          value={truck.id}
                          checked={selectedTruckId === truck.id}
                          onChange={(e) => setSelectedTruckId(e.target.value)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-gray-900">{truck.plateNumber}</p>
                            {truck.id === request.preferredTruckId && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                Tercih Edilen
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{truck.type}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Info if different truck selected */}
              {selectedTruckId !== request.preferredTruckId && selectedTruck && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                  <p className="text-xs text-orange-800">
                    ⚠️ Sürücünün tercih ettiği araçtan farklı bir araç seçiyorsunuz: <strong>{selectedTruck.plateNumber}</strong>
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setIsRejecting(true)}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border-2 border-red-500 text-red-600 rounded-lg font-medium hover:bg-red-50 disabled:opacity-50"
                >
                  {APPROVALS.reject}
                </button>
                <button
                  onClick={handleApprove}
                  disabled={!selectedTruckId || isSubmitting || availableTrucks.length === 0}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {APPROVALS.approve}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Rejection Form */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Talebi Reddet</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Sürücüye neden araç atanamadığını açıklayın.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Red Nedeni *
                  </label>
                  <textarea
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    placeholder="Örn: Şu anda müsait araç bulunmuyor, lütfen daha sonra tekrar deneyin."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={4}
                  />
                </div>
              </div>

              {/* Rejection Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setIsRejecting(false);
                    setRejectionNote('');
                  }}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  {COMMON.cancel}
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionNote.trim() || isSubmitting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {APPROVALS.reject}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TruckAssignmentModal;
