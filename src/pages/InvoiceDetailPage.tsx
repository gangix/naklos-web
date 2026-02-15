import { useParams, useNavigate } from 'react-router-dom';
import { mockInvoices, mockTrips } from '../data/mock';
import { INVOICES } from '../constants/text';
import { formatCurrency, formatDate } from '../utils/format';

const InvoiceDetailPage = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();

  const invoice = mockInvoices.find((inv) => inv.id === invoiceId);

  if (!invoice) {
    return (
      <div className="p-4">
        <p className="text-center text-gray-600">Fatura bulunamadı</p>
      </div>
    );
  }

  // Get related trips
  const relatedTrips = mockTrips.filter((trip) => invoice.tripIds.includes(trip.id));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return INVOICES.paid;
      case 'pending':
        return INVOICES.pending;
      case 'overdue':
        return INVOICES.overdue;
      default:
        return status;
    }
  };

  const getDaysOverdue = () => {
    if (invoice.status !== 'overdue') return null;
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    const diffTime = today.getTime() - dueDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysOverdue = getDaysOverdue();

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
          <h1 className="text-2xl font-bold text-gray-900">Fatura #{invoice.id.split('-')[1]}</h1>
          <p className="text-sm text-gray-600 mt-1">{invoice.clientName}</p>
        </div>
      </div>

      {/* Status and Amount Card */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">{INVOICES.amount}</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(invoice.amount)}</p>
          </div>
          <span className={`px-3 py-2 rounded-lg text-sm font-medium border ${getStatusColor(invoice.status)}`}>
            {getStatusLabel(invoice.status)}
          </span>
        </div>

        {daysOverdue && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-800 font-medium">
              ⚠️ {daysOverdue} {INVOICES.daysOverdue}
            </p>
          </div>
        )}
      </div>

      {/* Payment Information */}
      <div className="bg-white rounded-lg p-4 shadow-sm mb-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">{INVOICES.paymentInfo}</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">{INVOICES.issueDate}</span>
            <span className="text-sm font-medium text-gray-900">{formatDate(invoice.issueDate)}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">{INVOICES.dueDate}</span>
            <span className="text-sm font-medium text-gray-900">{formatDate(invoice.dueDate)}</span>
          </div>
          {invoice.paidDate && (
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">{INVOICES.paidDate}</span>
              <span className="text-sm font-medium text-green-600">
                ✓ {formatDate(invoice.paidDate)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Related Trips */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          {INVOICES.relatedTrips} ({relatedTrips.length})
        </h2>
        {relatedTrips.length > 0 ? (
          <div className="space-y-2">
            {relatedTrips.map((trip) => (
              <div key={trip.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900">
                    {trip.originCity} → {trip.destinationCity}
                  </p>
                  <p className="text-sm font-bold text-green-600">
                    {formatCurrency(trip.revenue)}
                  </p>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{trip.truckPlate}</span>
                  <span>{formatDate(trip.createdAt)}</span>
                </div>
                {trip.deliveryDocuments && trip.deliveryDocuments.length > 0 && (
                  <p className="text-xs text-green-600 mt-2">
                    ✓ {trip.deliveryDocuments.length} teslimat belgesi
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">İlgili sefer bulunamadı</p>
        )}
      </div>

      {/* Placeholder for future actions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 Yakında: E-posta gönderme ve PDF indirme özellikleri eklenecek
        </p>
      </div>
    </div>
  );
};

export default InvoiceDetailPage;
