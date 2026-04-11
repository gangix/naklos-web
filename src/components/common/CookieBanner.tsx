import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'naklos_cookie_consent';

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem(STORAGE_KEY);
    if (!accepted) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
      <div className="max-w-4xl mx-auto pointer-events-auto bg-white rounded-xl shadow-2xl border border-gray-200 p-4 md:p-5 flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 text-sm text-gray-700">
          <p>
            🍪 Naklos yalnızca oturum yönetimi için zorunlu çerezler kullanır. Platformu kullanarak{' '}
            <Link to="/privacy" className="text-primary-600 underline font-medium">
              Gizlilik Politikamızı
            </Link>
            {' '}ve{' '}
            <Link to="/terms" className="text-primary-600 underline font-medium">
              Kullanım Şartlarımızı
            </Link>
            {' '}kabul etmiş olursunuz.
          </p>
        </div>
        <button
          onClick={accept}
          className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors whitespace-nowrap"
        >
          Anladım
        </button>
      </div>
    </div>
  );
};

export default CookieBanner;
