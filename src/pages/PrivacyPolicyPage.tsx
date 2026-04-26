import { Link } from 'react-router-dom';
import { Truck } from 'lucide-react';

const PrivacyPolicyPage = () => {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Gizlilik Politikası</h1>
        <p className="text-sm text-gray-500 mb-10">Son güncelleme: {new Date().toLocaleDateString('tr-TR')}</p>

        <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Veri Sorumlusu</h2>
            <p>
              Bu Gizlilik Politikası, Naklos Filo Yönetim Platformu ("Naklos", "biz", "bizim") tarafından
              6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") kapsamında hazırlanmıştır.
              Platformu kullanarak aşağıda açıklanan koşulları kabul etmiş sayılırsınız.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. İşlenen Kişisel Veriler</h2>
            <p>Platformda aşağıdaki kişisel veriler işlenmektedir:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li><strong>Kimlik verileri:</strong> ad, soyad, e-posta adresi</li>
              <li><strong>İletişim verileri:</strong> telefon numarası, iş yeri adresi</li>
              <li><strong>Ehliyet ve sertifika bilgileri:</strong> ehliyet numarası, sınıfı, geçerlilik tarihi,
                SRC ve CPC sertifikaları</li>
              <li><strong>Filo verileri:</strong> araç plakaları, sigorta ve muayene bilgileri</li>
              <li><strong>Kullanım verileri:</strong> uygulamaya giriş zamanları, gerçekleştirilen işlemler</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Verilerin İşlenme Amacı</h2>
            <p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Filo yönetimi hizmetlerinin sunulması</li>
              <li>Araç ve sürücü kayıtlarının tutulması</li>
              <li>Belge geçerlilik tarihlerinin takip edilmesi ve hatırlatma gönderilmesi</li>
              <li>Hesap yönetimi ve kimlik doğrulama</li>
              <li>Müşteri desteği sağlanması</li>
              <li>Yasal yükümlülüklerin yerine getirilmesi</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Verilerin Aktarımı</h2>
            <p>
              Kişisel verileriniz, hizmetin sunulması için zorunlu olan altyapı sağlayıcılarımız (sunucu,
              kimlik doğrulama, e-posta) ile paylaşılabilir. Bu sağlayıcılar veri işleme anlaşmaları
              kapsamında KVKK ve GDPR uyumlu şekilde çalışmaktadır. Kişisel verileriniz yurtdışında
              Avrupa Birliği veri merkezlerinde işlenebilir.
            </p>
            <p className="mt-2">
              Yasal zorunluluklar dışında, verileriniz üçüncü kişilerle paylaşılmaz.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Saklama Süresi</h2>
            <p>
              Kişisel verileriniz, hizmetin sunulması süresince ve hesabınızın silinmesinden sonra en fazla
              3 yıl boyunca saklanır. Yasal yükümlülükler gereği daha uzun saklanması gereken veriler için
              ilgili mevzuat süreleri geçerlidir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. KVKK Haklarınız</h2>
            <p>KVKK'nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme</li>
              <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
              <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
              <li>Silinmesini veya yok edilmesini isteme</li>
              <li>Düzeltme, silme ve yok etme işlemlerinin üçüncü kişilere bildirilmesini isteme</li>
              <li>Otomatik sistemler analiziyle aleyhinize bir sonuç ortaya çıkmasına itiraz etme</li>
              <li>Zarara uğramanız halinde zararın giderilmesini talep etme</li>
            </ul>
            <p className="mt-3">
              Bu haklarınızı kullanmak için <strong>info@naklos.com.tr</strong> adresine yazılı başvuruda
              bulunabilirsiniz. Başvurunuz en geç 30 gün içinde yanıtlanacaktır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. Çerezler</h2>
            <p>
              Platformumuz, oturum yönetimi ve güvenlik için zorunlu çerezler kullanmaktadır.
              Analitik veya pazarlama amaçlı üçüncü taraf çerezler kullanılmamaktadır.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Güvenlik</h2>
            <p>
              Kişisel verilerinizin güvenliği için teknik ve idari tedbirler almaktayız.
              Veriler şifrelenmiş kanallar üzerinden iletilir ve yetkisiz erişime karşı korunur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">9. İletişim</h2>
            <p>
              Bu Gizlilik Politikası hakkında sorularınız için <strong>info@naklos.com.tr</strong>
              adresi üzerinden bize ulaşabilirsiniz.
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

export default PrivacyPolicyPage;
