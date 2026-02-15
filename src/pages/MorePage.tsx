const MorePage = () => {
  const menuItems = [
    { label: 'Şoförler', icon: '👤', badge: '12' },
    { label: 'Raporlar', icon: '📊', badge: null },
    { label: 'Ayarlar', icon: '⚙️', badge: null },
    { label: 'Yardım', icon: '❓', badge: null },
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Daha Fazla</h1>

      <div className="space-y-2">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className="w-full bg-white rounded-lg p-4 shadow-sm flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{item.icon}</span>
              <span className="font-medium text-gray-900">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {item.badge && (
                <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                  {item.badge}
                </span>
              )}
              <span className="text-gray-400">›</span>
            </div>
          </button>
        ))}
      </div>

      {/* App info */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Naklos Filo Yönetimi</p>
        <p className="mt-1">v1.0.0</p>
      </div>
    </div>
  );
};

export default MorePage;
