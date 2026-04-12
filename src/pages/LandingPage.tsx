import { Truck, Users, AlertTriangle, Building2, Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LandingPage = () => {
  const { login, loginWith, register } = useAuth();

  const features = [
    {
      icon: Truck,
      title: 'Araç Takibi',
      description: 'Tüm araçlarınızı tek bir yerden yönetin. Sigorta, muayene ve kasko bitiş tarihlerini kaçırmayın.',
      accent: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
    },
    {
      icon: Users,
      title: 'Sürücü Yönetimi',
      description: 'Ehliyet, SRC ve CPC belgelerini takip edin. Yenileme zamanı geldiğinde otomatik bildirim alın.',
      accent: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
    },
    {
      icon: AlertTriangle,
      title: 'Belge Uyarıları',
      description: 'Süresi dolan belgeler için otomatik uyarılar. Cezalardan ve işletme kesintilerinden kurtulun.',
      accent: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-50',
      text: 'text-amber-600',
    },
    {
      icon: Building2,
      title: 'Müşteri Kaydı',
      description: 'Müşterilerinizi, ödeme vadelerini ve iletişim bilgilerini düzenli tutun.',
      accent: 'from-violet-500 to-violet-600',
      bg: 'bg-violet-50',
      text: 'text-violet-600',
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
    <div className="min-h-screen bg-[#fafbfc]">
      {/* Subtle dot grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      {/* Top bar */}
      <header className="relative bg-white/80 backdrop-blur-md border-b border-gray-200/60 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm shadow-primary-500/20">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-gray-900">Naklos</span>
          </div>
          <button
            onClick={login}
            className="px-4 py-2 text-sm font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-all"
          >
            Giriş Yap
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-4 pt-20 pb-16 md:pt-32 md:pb-24 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-xs font-semibold mb-8 border border-primary-100">
          <span className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
          KOBİ filoları için
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-[1.1] tracking-tight">
          Filonuzu kolayca
          <br />
          <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-blue-400 bg-clip-text text-transparent">
            yönetin
          </span>
        </h1>

        <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">
          Araçlar, sürücüler ve müşteriler için tek bir çözüm.
          <br className="hidden md:block" />
          Belge yenileme tarihlerini asla kaçırmayın.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
          <button
            onClick={register}
            className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl font-bold text-base hover:shadow-xl hover:shadow-primary-500/25 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            Ücretsiz Başlayın
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            onClick={login}
            className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all text-base"
          >
            Zaten hesabım var
          </button>
        </div>

        {/* Social login */}
        <div className="max-w-sm mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[11px] text-gray-400 font-semibold tracking-widest uppercase">veya</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => loginWith('google')}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-3 text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google ile devam et
            </button>
            <button
              onClick={() => loginWith('apple')}
              className="w-full px-4 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition-all flex items-center justify-center gap-3 text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.42C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              Apple ile devam et
            </button>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            İhtiyacınız olan her şey
          </h2>
          <p className="text-lg text-gray-500 max-w-lg mx-auto">
            Karmaşık değil — sadece işinizin ihtiyaç duyduğu özellikler
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-11 h-11 rounded-xl ${feature.bg} ${feature.text} flex items-center justify-center mb-5`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2 text-[15px]">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits */}
      <section className="relative bg-white py-20 md:py-24 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-5 tracking-tight leading-tight">
                Excel tablolarıyla
                <br />
                vedalaşın
              </h2>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed">
                Küçük filolar için tasarlandı. Karmaşık kurulum yok, uzun eğitim yok. Beş dakikada başlayın.
              </p>
              <button
                onClick={register}
                className="group px-6 py-3.5 bg-gray-900 text-white rounded-xl font-semibold hover:bg-black transition-all flex items-center gap-2"
              >
                Hemen Deneyin
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3" strokeWidth={3} />
                    </div>
                    <span className="text-gray-600 text-[15px] leading-relaxed">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-400">
          <div className="flex items-center justify-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
              <Truck className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-extrabold text-gray-900 tracking-tight">Naklos</span>
          </div>
          <div className="flex items-center justify-center gap-6 mb-4">
            <Link to="/privacy" className="hover:text-gray-600 transition-colors">
              Gizlilik Politikası
            </Link>
            <Link to="/terms" className="hover:text-gray-600 transition-colors">
              Kullanım Şartları
            </Link>
          </div>
          <p className="text-gray-400">© {new Date().getFullYear()} Naklos. Tüm hakları saklıdır.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
