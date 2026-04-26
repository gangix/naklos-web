import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';

const TermsOfServicePage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-50">
      <header className="bg-white/70 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary-600 flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Naklos</span>
          </Link>
          <Link to="/" className="text-sm font-medium text-primary-600 hover:text-primary-700">
            ← Geri
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Kullanım Şartları</h1>
        <p className="text-sm text-gray-500 mb-10">Son güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>

        <div className="text-gray-700 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Hizmetin Tanımı</h2>
            <p>
              Naklos, küçük ve orta ölçekli filolar için tasarlanmış bir filo yönetim platformudur.
              Araç, sürücü ve müşteri kayıtlarının tutulması, belge geçerlilik tarihlerinin takibi ve
              hatırlatma e-postaları gibi hizmetler sunar.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. Hesap Oluşturma</h2>
            <p>
              Platformu kullanmak için bir hesap oluşturmanız gerekmektedir. Hesap bilgilerinizin
              doğruluğundan ve güvenliğinden siz sorumlusunuz. Başka bir kişinin bilgilerini kullanmak
              veya sahte bilgi vermek yasaktır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Kullanıcı Sorumlulukları</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Platformu yasalara uygun amaçlarla kullanmak</li>
              <li>Başka kullanıcıların haklarına saygı göstermek</li>
              <li>Veri güvenliğini tehlikeye atacak faaliyetlerde bulunmamak</li>
              <li>Sisteme yetkisiz erişim denemelerinde bulunmamak</li>
              <li>Platformu ticari amaçlı olarak yeniden satmamak</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Veri Sahipliği</h2>
            <p>
              Platforma girdiğiniz tüm filo verileri (araç, sürücü, müşteri bilgileri) size aittir.
              Naklos, bu verileri yalnızca hizmet sunmak için işler ve üçüncü taraflara satmaz.
              Hesabınızı iptal ettiğinizde verilerinizi dışa aktarma hakkınız vardır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Hizmet Seviyesi</h2>
            <p>
              Platformu olabildiğince kesintisiz çalışır tutmaya çalışıyoruz, ancak %100 kesintisiz
              hizmet garanti edilemez. Planlı bakım çalışmaları önceden duyurulur. Öngörülemeyen
              kesintiler veya veri kayıpları için sorumluluk sınırlıdır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. Sorumluluk Sınırı</h2>
            <p>
              Naklos, belge yenileme hatırlatmalarını en iyi şekilde sunmaya çalışır ancak bu
              hatırlatmaların alınmaması veya zamanında teslim edilmemesi sonucu oluşan cezalar,
              gecikmeler veya diğer zararlardan sorumlu tutulamaz. Belge takibi nihai olarak
              kullanıcının sorumluluğundadır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Hesap İptali</h2>
            <p>
              Hesabınızı istediğiniz zaman iptal edebilirsiniz. Kullanım şartlarının ihlali halinde
              Naklos, hesabınızı önceden bildirimde bulunarak askıya alabilir veya sonlandırabilir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Değişiklikler</h2>
            <p>
              Bu kullanım şartları güncellenebilir. Önemli değişiklikler size e-posta yoluyla
              bildirilir. Güncellemelerden sonra platformu kullanmaya devam etmeniz, yeni şartları
              kabul ettiğiniz anlamına gelir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. Uygulanacak Hukuk</h2>
            <p>
              Bu şartlar Türkiye Cumhuriyeti kanunlarına tabidir. Doğabilecek uyuşmazlıklarda
              İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. İletişim</h2>
            <p>
              Kullanım şartları hakkında sorularınız için <strong>info@naklos.com.tr</strong> adresi
              üzerinden bize ulaşabilirsiniz.
            </p>
          </section>
        </div>
      </main>

      <footer className="py-8 px-4 border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Naklos. Tüm hakları saklıdır.
        </div>
      </footer>
    </div>
  );
};

export default TermsOfServicePage;
