import { CLIENTS } from '../constants/text';

const ClientsPage = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">{CLIENTS.title}</h1>

      {/* Search bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Müşteri ara..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Client list */}
      <div className="space-y-3">
        {[
          {
            name: 'Anadolu Gıda A.Ş.',
            outstanding: '₺24,500',
            reliability: 'good',
          },
          {
            name: 'Ege Tekstil Ltd.',
            outstanding: '₺0',
            reliability: 'good',
          },
          {
            name: 'Marmara İnşaat',
            outstanding: '₺15,500',
            reliability: 'poor',
            overdue: true,
          },
          {
            name: 'Akdeniz Mobilya',
            outstanding: '₺8,200',
            reliability: 'moderate',
          },
        ].map((client, index) => (
          <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      client.reliability === 'good'
                        ? 'bg-green-500'
                        : client.reliability === 'moderate'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                  />
                  <p className="font-bold text-gray-900">{client.name}</p>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Bakiye: <span className="font-medium">{client.outstanding}</span>
                </p>
                {client.overdue && (
                  <p className="text-xs text-red-600 mt-1">Vadesi geçmiş fatura var</p>
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
