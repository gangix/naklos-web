import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useClients } from '../hooks/useApiData';
import { useFleet } from '../contexts/FleetContext';
import AddClientModal from '../components/common/AddClientModal';
import UpgradeModal from '../components/common/UpgradeModal';

const ClientsPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: clients, loading: clientsLoading, refresh } = useClients();
  const { plan } = useFleet();
  const maxClients = { FREE: 3, PROFESSIONAL: -1, BUSINESS: -1, ENTERPRISE: -1 }[plan] ?? 3;
  const [searchQuery, setSearchQuery] = useState('');
  const [addClientModalOpen, setAddClientModalOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

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
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 mb-4">{t('client.title')}</h1>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
          {t('client.title')}
          <span className="text-sm font-medium text-gray-400 ml-2">
            ({clients.length}{maxClients !== -1 ? `/${maxClients}` : ''})
          </span>
        </h1>
        <button
          onClick={() => maxClients !== -1 && clients.length >= maxClients ? setUpgradeModalOpen(true) : setAddClientModalOpen(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all"
        >
          {t('clientsPage.addClient')}
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder={t('clientsPage.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      <div className="space-y-3">
        {filteredClients.length === 0 && clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{t('clientsPage.emptyTitle')}</h3>
            <p className="text-sm text-gray-500 mb-6">{t('clientsPage.emptyHint')}</p>
            <button
              onClick={() => maxClients !== -1 && clients.length >= maxClients ? setUpgradeModalOpen(true) : setAddClientModalOpen(true)}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              {t('clientsPage.addClient')}
            </button>
          </div>
        ) : filteredClients.length === 0 && clients.length > 0 ? (
          <div className="bg-white rounded-lg p-6 text-center text-gray-500">
            {t('clientsPage.noFilterResult')}
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

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        resource="client"
        currentPlan={plan}
      />
    </div>
  );
};

export default ClientsPage;
