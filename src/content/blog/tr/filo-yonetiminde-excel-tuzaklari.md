---
slug: filo-yonetiminde-excel-tuzaklari
title: Filo Yönetiminde Excel'in 5 Büyük Tuzağı
description: Küçük ve orta ölçekli filolarda Excel ile takip neden başarısız olur? 5 somut tuzak ve veri kayıplarına yol açan örnekler.
date: 2026-04-26
readingTimeMinutes: 6
locale: tr
ogImage: /og/excel-tuzaklari.png
---

Türkiye'deki nakliyat firmalarının büyük çoğunluğu hâlâ filo takibini Excel'de yapıyor. 5 araçlık bir filoda Excel idare eder. 10 aracın üzerine çıktığınızda her ay bir şey unutulmaya başlar — bir muayene tarihi, bir sigorta bitişi, bir şüpheli yakıt dolumu. Bu yazıda, filo yönetiminde Excel'in yarattığı 5 somut tuzağı ve her birinin ortalama bir filoda yarattığı maliyeti ele alıyoruz.

## Tuzak 1: Hatırlatma Yok — Tarihler Sessizce Geçer

Excel size hiçbir zaman "muayeneye 7 gün kaldı" demez. Hatırlatma sizin sorumluluğunuzdur.

Tipik senaryo:

- Yıl başında 12 aracın muayene tarihleri listelenir
- Şubat'ta filo yöneticisi araç ekler, listeyi güncellemez
- Haziran'da bir araç muayene tarihi geçtiği için trafikten alınır
- Ceza + iki gün servis dışı kalma = ortalama **₺16.000 kayıp**

Aynı durum sigorta, MTV, kasko ve K belgesi yenilemesi için geçerlidir. Her unutulan belge ortalama 1–3 gün servis dışı kalma anlamına gelir.

**Çözüm beklentisi:** Bitiş tarihinden 30, 14 ve 7 gün önce otomatik e-posta uyarısı.

## Tuzak 2: Sürüm Çakışması — "Hangi Excel Doğru?"

Filo Excel'i çoğunlukla birden fazla kişi tarafından kullanılır: filo yöneticisi, muhasebe, sahibi. WhatsApp veya e-posta ile dolaşan dosya zamanla şu hale gelir:

- `filo_takip_v2.xlsx`
- `filo_takip_v2_son.xlsx`
- `filo_takip_v2_son_FINAL.xlsx`
- `filo_takip_2026_yenisi.xlsx`

Her birinde farklı bir kişi farklı bir güncelleme yapmıştır. Doğru sürüm hangisi olduğu belirsizdir. Çakışan değişiklikler kaybolur.

Google Sheets ile bu kısmen çözülür ama yeni sorunlar açar: yetki kontrolü zayıftır, sürücüler dosyayı yanlışlıkla bozabilir, çevrimdışı çalışmaz.

**Çözüm beklentisi:** Tek bir merkezi sistem, kim ne değişiklik yaptı görülebilir, çakışma yoktur.

## Tuzak 3: Manuel Veri Girişi Hataları

İnsanlar her 100 satırda ortalama 1–3 hata yapar. Filo Excel'inde bir tipik hata:

- **Plaka yanlış girilir:** "34 ABC 123" yerine "34 ABC 132"
- **Litre miktarı kaymış:** 127 yerine 1270 girilmiş
- **Tarih formatı karışmış:** "03/04" Mart 4 mü, Nisan 3 mü?
- **Kilometre gerilemiş:** Önceki dolumdan az km girilmiş

Tek başına küçük görünen bu hatalar, ay sonu raporda araç başına yakıt tüketimini hesaplarken tüm sonuçları bozar. Sahte yüksek tüketim gösteren bir araç hakkında sürücüye haksız yere uyarı yapılması kuruma güveni sarsar.

**Çözüm beklentisi:** Otomatik veri içe aktarma (yakıt kartı ekstresi, dolum bilgileri), giriş anında validasyon.

## Tuzak 4: Anomali Tespiti İmkansızdır

Excel size bir aracın yakıt tüketiminin geçen aya göre %35 arttığını söylemez. Şüpheli bir dolumun (depo kapasitesini aşan, çok kısa aralıklı çifte dolum) varlığını size bildirmez. Bu kalıpları yakalamak için:

- Pivot tablo kurmanız gerekir
- Aylık manuel karşılaştırma yapmanız gerekir
- Şüphe duyduğunuz dolumu tek tek doğrulamanız gerekir

Pratikte hiç kimse bunu sürekli yapmaz. Sonuç: yakıt suistimali aylar boyunca fark edilmeden devam eder. 15 araçlık bir filoda aylık ₺500.000 yakıt giderinin %3–5'i (₺15.000–25.000) bu şekilde sızar.

**Çözüm beklentisi:** Her dolumda otomatik kural kontrolü — depo kapasitesi, zaman aralığı, kilometre tutarlılığı, L/100km sapması.

## Tuzak 5: Mobil Erişim Yok — Sürücü Sahada Görmüyor

Excel masada açıktır; sürücü yolda. Bu kopukluk şu sorunları yaratır:

- Sürücü kendi aracının evrak durumunu bilmez
- Bir arıza çıktığında geçmiş bakımları göremez
- Yeni dolum bilgisini ofise telefonla bildirmesi gerekir
- Belge fotoğrafı çekip WhatsApp'tan gönderirken kayıplar olur

Sahada akıllı telefon var, masada Excel var, ikisi konuşmuyor. Sonuç: bilgi gecikmeli, hatalı veya hiç gelmiyor.

**Çözüm beklentisi:** Sürücü için mobil görünüm — kendi aracının belge durumu, geçmiş bakımları, yeni dolum bildirebilme.

## Hangi Filolar İçin Excel Yetmez?

Aşağıdaki sorulardan ikiye ya da daha fazlasına "evet" diyorsanız, Excel sizin için artık yeterli değildir:

1. **10'dan fazla aracınız var mı?**
2. **Birden fazla kişi (filo yöneticisi + muhasebe) verileri günceller mi?**
3. **Son 12 ayda en az bir muayene/sigorta tarihini kaçırdınız mı?**
4. **Yakıt giderinizin doğru takibinden emin değil misiniz?**
5. **Sürücüleriniz sahada belge bilgisine ihtiyaç duyuyor mu?**

Bu beş sorudan ikisi üzeriniz Excel'in maliyeti, faydasından büyük olmaya başlamıştır.

## Naklos: Excel'i Bırakmadan Nereden Başlamalı?

Excel'i bir günde bırakmanız gerekmez. Naklos şunu önerir:

- **İlk hafta:** Araç bilgilerini ve belge tarihlerini sisteme aktarın. Hatırlatmalar otomatik açılır.
- **İkinci hafta:** Yakıt kartı ekstrenizi (OPET, Shell, BP) yükleyin. Şüpheli dolumlar otomatik işaretlenir.
- **Üçüncü hafta:** Sürücülerinize mobil erişim verin. Kendi araçlarının evrak durumunu ve bakım geçmişini görsünler.

3 araca kadar her zaman ücretsizdir. Donanım kurulumu yok, taahhüt yok. [Ana sayfadan başlayın](/) — 5 dakikada hesabınızı açın.

## Sıkça Sorulan Sorular

**Soru: Excel'imdeki verileri naklos'a nasıl aktarırım?**
Cevap: Araç listesini Excel'den CSV olarak dışa aktarın; naklos toplu yükleme aracı ile sisteme alın. Yakıt kartı ekstrelerini OPET/Shell/BP formatında doğrudan yüklenebilir.

**Soru: Naklos kullanmaya başlarken donanım gerekli mi?**
Cevap: Hayır. Bilgisayar veya akıllı telefon yeterlidir. GPS izleyici, kart okuyucu gibi donanım kurulumu gerekmez.

**Soru: 3 araç üstündeki filolar için ücret ne?**
Cevap: 4+ araç için Pro tier şu anda beta süresince ücretsizdir. Ücretlendirme başlamadan önce mutlaka önceden bildirim göndereceğiz.

**Soru: Verilerimin güvenliği nasıl sağlanıyor?**
Cevap: Tüm veriler KVKK uyumlu olarak saklanır, şifreli iletişim (HTTPS) kullanılır ve her müşterinin verisi izole edilmiştir.
