import { Truck, Users, AlertTriangle, Building2, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LandingPage = () => {
  const { login, loginWith, register } = useAuth();

  const features = [
    {
      icon: Truck,
      title: 'Araçlarınızı Takip Edin',
      description:
        'Tüm araçlarınızı tek bir yerden yönetin. Sigorta, muayene ve kasko bitiş tarihlerini kaçırmayın.',
    },
    {
      icon: Users,
      title: 'Sürücü Yönetimi',
      description:
        'Sürücülerinizin ehliyet, SRC ve CPC belgelerini takip edin. Yenileme zamanı geldiğinde otomatik bildirim alın.',
    },
    {
      icon: AlertTriangle,
      title: 'Belge Uyarıları',
      description:
        'Süresi dolan belgeler için otomatik uyarılar. Cezalardan ve işletme kesintilerinden kurtulun.',
    },
    {
      icon: Building2,
      title: 'Müşteri Kaydı',
      description:
        'Müşterilerinizi, ödeme vadelerini ve iletişim bilgilerini düzenli tutun.',
    },
  ];

  const benefits = [
    'Excel tablolarına son — her şey tek bir uygulamada',
    'Süresi geçmiş belgeler için otomatik uyarılar',
    'Sürücüler kendi bilgilerini güncelleyebilir',
    'Ücretsiz deneme — kredi kartı gerekmez',
    'Türkçe arayüz, Türkçe destek',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      {/* Top bar */}
      <header className="bg-white/70 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Naklos</span>
          </div>
          <button
            onClick={login}
            className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
          >
            Giriş Yap
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12 md:pt-24 md:pb-20 text-center">
        <div className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium mb-6">
          KOBİ filoları için
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Filonuzu kolayca<br />
          <span className="text-primary-600">yönetin</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Araçlar, sürücüler ve müşteriler için tek bir çözüm. Belge yenileme tarihlerini asla kaçırmayın, Excel kargaşasına son verin.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <button
            onClick={register}
            className="w-full sm:w-auto px-8 py-3.5 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 hover:shadow-xl hover:shadow-primary-600/30 hover:-translate-y-0.5"
          >
            Ücretsiz Başlayın
          </button>
          <button
            onClick={login}
            className="w-full sm:w-auto px-8 py-3.5 bg-white text-gray-700 rounded-xl font-semibold border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Zaten hesabım var
          </button>
        </div>

        {/* Social login */}
        <div className="max-w-sm mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-500 font-medium">VEYA</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => loginWith('google')}
              className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google ile devam et
            </button>
            <button
              onClick={() => loginWith('apple')}
              className="w-full px-4 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-900 transition-colors flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.42C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Apple ile devam et
            </button>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Filo yönetiminin tüm gerekli parçaları
          </h2>
          <p className="text-lg text-gray-600">
            Karmaşık değil — sadece işinizin ihtiyaç duyduğu özellikler
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-white py-16 md:py-20 border-y border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Excel tablolarıyla vedalaşın
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Küçük filolar için tasarlandı. Karmaşık kurulum yok, uzun eğitim yok. Beş dakikada başlayın.
              </p>
              <button
                onClick={register}
                className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
              >
                Hemen Deneyin
              </button>
            </div>
            <ul className="space-y-3">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center mt-0.5">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </div>
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-4 border-t border-gray-200">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-500">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-6 h-6 rounded bg-primary-600 flex items-center justify-center">
              <Truck className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900">Naklos</span>
          </div>
          <div className="flex items-center justify-center gap-6 mb-3">
            <Link to="/privacy" className="hover:text-primary-600 transition-colors">
              Gizlilik Politikası
            </Link>
            <Link to="/terms" className="hover:text-primary-600 transition-colors">
              Kullanım Şartları
            </Link>
          </div>
          <p>© {new Date().getFullYear()} Naklos. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
