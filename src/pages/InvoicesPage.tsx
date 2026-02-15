import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { INVOICES, COMMON } from '../constants/text';
import { mockInvoices } from '../data/mock';
import { formatCurrency, formatDate } from '../utils/format';
import type { InvoiceStatus } from '../types';

const InvoicesPage = () => {
  const [filter, setFilter] = useState<InvoiceStatus | 'all'>('all');

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalOutstanding = mockInvoices
      .filter((inv) => inv.status !== 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);

    const totalOverdue = mockInvoices
      .filter((inv) => inv.status === 'overdue')
      .reduce((sum, inv) => sum + inv.amount, 0);

    // Paid this month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const paidThisMonth = mockInvoices
      .filter((inv) => {
        if (inv.status !== 'paid' || !inv.paidDate) return false;
        const paidDate = new Date(inv.paidDate);
        return paidDate >= firstDayOfMonth;
      })
      .reduce((sum, inv) => sum + inv.amount, 0);

    // Average payment time (for paid invoices)
    const paidInvoices = mockInvoices.filter((inv) => inv.status === 'paid' && inv.paidDate);
    const avgPaymentDays = paidInvoices.length > 0
      ? Math.round(
          paidInvoices.reduce((sum, inv) => {
            const issue = new Date(inv.issueDate);
            const paid = new Date(inv.paidDate!);
            const days = Math.ceil((paid.getTime() - issue.getTime()) / (1000 * 60 * 60 * 24));
            return sum + days;
          }, 0) / paidInvoices.length
        )
      : 0;

    return {
      totalOutstanding,
      totalOverdue,
      paidThisMonth,
      avgPaymentDays,
    };
  }, []);

  // Filter invoices
  const filteredInvoices = useMemo(() => {
    if (filter === 'all') return mockInvoices;
    return mockInvoices.filter((inv) => inv.status === filter);
  }, [filter]);

  // Count by status
  const counts = useMemo(() => {
    return {
      all: mockInvoices.length,
      overdue: mockInvoices.filter((inv) => inv.status === 'overdue').length,
      pending: mockInvoices.filter((inv) => inv.status === 'pending').length,
      paid: mockInvoices.filter((inv) => inv.status === 'paid').length,
    };
  }, []);

  const getStatusColor = (status: InvoiceStatus) => {
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

  const getStatusLabel = (status: InvoiceStatus) => {
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

  const getDaysInfo = (invoice: typeof mockInvoices[0]) => {
    const today = new Date();
    const dueDate = new Date(invoice.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (invoice.status === 'overdue') {
      return {
        text: `${Math.abs(diffDays)} ${INVOICES.daysOverdue}`,
        color: 'text-red-600',
      };
    } else if (invoice.status === 'pending' && diffDays <= 7) {
      return {
        text: `${diffDays} ${INVOICES.daysUntilDue}`,
        color: 'text-orange-600',
      };
    }
    return null;
  };

  return (
    <div className="p-4 pb-20">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{INVOICES.title}</h1>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <p className="text-xs text-gray-600 mb-1">{INVOICES.totalOutstanding}</p>
          <p className="text-lg font-bold text-orange-600">{formatCurrency(summary.totalOutstanding)}</p>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <p className="text-xs text-gray-600 mb-1">{INVOICES.totalOverdue}</p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(summary.totalOverdue)}</p>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <p className="text-xs text-gray-600 mb-1">{INVOICES.paidThisMonth}</p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(summary.paidThisMonth)}</p>
        </div>
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <p className="text-xs text-gray-600 mb-1">{INVOICES.avgPaymentTime}</p>
          <p className="text-lg font-bold text-primary-600">
            {summary.avgPaymentDays} {COMMON.days}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
            filter === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {INVOICES.all} ({counts.all})
        </button>
        <button
          onClick={() => setFilter('overdue')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
            filter === 'overdue'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {INVOICES.overdue} ({counts.overdue})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
            filter === 'pending'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {INVOICES.pending} ({counts.pending})
        </button>
        <button
          onClick={() => setFilter('paid')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
            filter === 'paid'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {INVOICES.paid} ({counts.paid})
        </button>
      </div>

      {/* Invoice List */}
      <div className="space-y-3">
        {filteredInvoices.map((invoice) => {
          const daysInfo = getDaysInfo(invoice);
          return (
            <Link
              key={invoice.id}
              to={`/invoices/${invoice.id}`}
              className="block bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-bold text-gray-900">{invoice.clientName}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {INVOICES.issueDate}: {formatDate(invoice.issueDate)}
                  </p>
                  {invoice.status === 'paid' && invoice.paidDate && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ {INVOICES.paidDate}: {formatDate(invoice.paidDate)}
                    </p>
                  )}
                  {daysInfo && (
                    <p className={`text-xs font-medium mt-1 ${daysInfo.color}`}>
                      ⚠️ {daysInfo.text}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(invoice.amount)}
                  </p>
                  <span className={`inline-block mt-1 px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                    {getStatusLabel(invoice.status)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span>{INVOICES.dueDate}: {formatDate(invoice.dueDate)}</span>
                <span>{invoice.tripIds.length} {INVOICES.trips}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default InvoicesPage;
