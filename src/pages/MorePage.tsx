import { useNavigate } from 'react-router-dom';
import { mockFleet } from '../data/mock';

const MorePage = () => {
  const navigate = useNavigate();

  const menuItems = [
    {
      icon: '👤',
      title: 'Sürücüler',
      description: 'Sürücü listesi ve belgeler',
      path: '/drivers',
      color: 'bg-green-100',
    },
    {
      icon: '💰',
      title: 'Ödemeler',
      description: 'Faturalar ve tahsilatlar',
      path: '/invoices',
      color: 'bg-purple-100',
    },
    {
      icon: '👥',
      title: 'Müşteriler',
      description: 'Müşteri listesi ve ödeme durumu',
      path: '/clients',
      color: 'bg-blue-100',
    },
  ];

  return (
    <div className="p-4 pb-20">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Diğer</h1>
        <p className="text-sm text-gray-600 mt-1">{mockFleet.name}</p>
      </div>

      {/* Menu Items */}
      <div className="space-y-3">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="w-full bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${item.color} rounded-lg flex items-center justify-center text-2xl`}>
                  {item.icon}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
              <span className="text-gray-400 text-xl">›</span>
            </div>
          </button>
        ))}
      </div>

      {/* App Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600 text-center">
          Naklos Filo Yönetimi
        </p>
        <p className="text-xs text-gray-500 text-center mt-1">
          Versiyon 1.0.0
        </p>
      </div>
    </div>
  );
};

export default MorePage;
