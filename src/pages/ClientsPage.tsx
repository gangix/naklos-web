import { useState, useMemo } from 'react';
import { CLIENTS } from '../constants/text';
import { mockClients } from '../data/mock';
import { formatCurrency } from '../utils/format';

const ClientsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredClients = useMemo(() => {
    if (!searchQuery) return mockClients;
    const query = searchQuery.toLowerCase();
    return mockClients.filter((client) =>
      client.companyName.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const getReliabilityColor = (reliability: string) => {
    switch (reliability) {
      case 'good':
        return 'bg-green-500';
      case 'moderate':
        return 'bg-yellow-500';
      case 'poor':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{CLIENTS.title}</h1>

      {/* Search bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Müşteri ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Client list */}
      <div className="space-y-3">
        {filteredClients.map((client) => (
          <div key={client.id} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${getReliabilityColor(client.paymentReliability)}`} />
                  <p className="font-bold text-gray-900">{client.companyName}</p>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {CLIENTS.contact}: {client.contactPerson}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Bakiye: <span className="font-medium">{formatCurrency(client.outstanding)}</span>
                </p>
                {client.overdue > 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ Vadesi geçmiş: {formatCurrency(client.overdue)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClientsPage;
