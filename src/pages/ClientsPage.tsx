import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CLIENTS } from '../constants/text';
import { useClients } from '../hooks/useApiData';
import AddClientModal from '../components/common/AddClientModal';

const ClientsPage = () => {
  const navigate = useNavigate();
  const { data: clients, loading: clientsLoading, refresh } = useClients();
  const [searchQuery, setSearchQuery] = useState('');
  const [addClientModalOpen, setAddClientModalOpen] = useState(false);

  const filteredClients = useMemo(() => {
    if (!searchQuery) return clients;
    const query = searchQuery.toLowerCase();
    return clients.filter((client: any) => {
      const name = client.companyName || client.name || '';
      return name.toLowerCase().includes(query);
    });
  }, [searchQuery, clients]);

  if (clientsLoading) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{CLIENTS.title}</h1>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{CLIENTS.title}</h1>
        <button
          onClick={() => setAddClientModalOpen(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          + Müşteri Ekle
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Müşteri ara..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="space-y-3">
        {filteredClients.length === 0 ? (
          <div className="bg-white rounded-lg p-6 text-center text-gray-500">
            Henüz müşteri eklenmedi
          </div>
        ) : (
          filteredClients.map((client: any) => (
            <button
              key={client.id}
              onClick={() => navigate(`/manager/clients/${client.id}`)}
              className="w-full bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow text-left"
            >
              <p className="font-bold text-gray-900">{client.name || client.companyName}</p>
              {client.city && (
                <p className="text-sm text-gray-600 mt-1">{client.city}</p>
              )}
              {client.phone && (
                <p className="text-sm text-gray-500 mt-1">{client.phone}</p>
              )}
            </button>
          ))
        )}
      </div>

      <AddClientModal
        isOpen={addClientModalOpen}
        onClose={() => setAddClientModalOpen(false)}
        onSuccess={refresh}
      />
    </div>
  );
};

export default ClientsPage;
