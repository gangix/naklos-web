---
slug: opet-shell-yakit-karti-ekstresi-analizi
title: OPET ve Shell Yakıt Kartı Ekstresi Analizi
description: OPET, Shell ve BP yakıt kartı ekstrelerini adım adım analiz etmek için sütun eşlemeleri, temizleme adımları ve kontrol listesi.
date: 2026-04-21
readingTimeMinutes: 5
locale: tr
ogImage: /og/yakit-karti-analiz.png
---

Her büyük yakıt firması kurumsal müşterilerine farklı bir Excel formatı verir. OPET sütunları Shell'le aynı değildir, Shell sütunları BP'yle uyuşmaz. Bu yazıda üç büyük sağlayıcının ekstresini nasıl standart hale getireceğinizi ve ayda bir saatten az zamanla nasıl temiz bir yakıt raporu çıkaracağınızı gösteriyoruz.

## Ekstreyi nereden indirirsiniz?

Üç büyük sağlayıcının portalı da benzer çalışır:

- **OPET Kurumsal:** oportal.opet.com.tr üzerinden "Raporlar" sekmesi. Aylık ekstreyi XLSX veya CSV olarak indirin.
- **Shell Card Online:** shellcardonline.com.tr üzerinden "İşlem Raporu" → Excel'e aktar.
- **BP Plus:** bpplus.com.tr üzerinden "Dönem Hareketleri". Hem XLSX hem PDF desteği var; analiz için mutlaka XLSX seçin.

Her ay aynı dönemi (ör. ayın 1'i ile sonu) seçerek indirmek en sağlıklısıdır. Takvim dışı dönemler raporlar arası karşılaştırmayı zorlaştırır.

## Sütun eşlemeleri

Üç sağlayıcının sütun başlıkları farklıdır. Analizden önce ortak bir şemaya çevirmek gerekir:

| Standart alan     | OPET                  | Shell                 | BP                    |
|-------------------|-----------------------|-----------------------|-----------------------|
| Tarih/Saat        | İşlem Tarihi          | Transaction Date      | Tarih                 |
| Plaka             | Araç Plakası          | Vehicle ID            | Araç No               |
| İstasyon          | İstasyon Adı          | Site Name             | İstasyon              |
| Litre             | Miktar                | Volume                | Hacim                 |
| Tutar (TL)        | Tutar                 | Total Amount          | Tutar                 |
| Kilometre         | KM                    | Odometer              | Km Sayacı             |
| Ürün              | Ürün Tipi             | Product               | Yakıt Türü            |

Plaka sütunu en çok sorun yaratanıdır: aynı plaka üç farklı formatta görünebilir ("34 ABC 123", "34ABC123", "34-ABC-123"). Analizden önce boşlukları ve tireleri temizleyin.

## Temizleme adımları

Her ekstre için sırasıyla uygulayın:

1. **Başlıkları düzelt.** İlk satıra standart sütun adlarını yazın.
2. **Plakaları normalize et.** `TRIM` + `SUBSTITUTE` ile boşluk ve tireleri kaldırın, büyük harfe çevirin.
3. **Ürün filtrele.** Sadece motorin/dizel satırlarını bırakın; AdBlue, benzin ve yağlayıcı satırlarını çıkarın (ayrı bir analiz için saklayın).
4. **Duplike kontrolü.** Aynı tarih, plaka, istasyon ve tutar kombinasyonu tekrarlanıyor mu?
5. **Kilometre eksiklerini işaretle.** KM=0 veya boş olan satırlar anomali takibinden çıkarılamaz.

Bu beş adım çoğu ekstrede 15–20 dakika sürer; birkaç ay uygulayınca makro veya Google Sheets script olarak otomatikleştirebilirsiniz.

## Neye bakmalısınız?

Temiz ekstre üzerinde şu beş rapor en yüksek değeri sağlar:

- **Araç bazlı aylık litre.** Hangi araç ne kadar yakıyor? En çok yakan 3 araç filonun %40'ından fazlasını tüketiyorsa sebep sorgulanmalı.
- **L/100km dağılımı.** Filonun ortalaması 27 L/100km ise, 33+ yakan araçları listeleyin.
- **Mesai dışı dolumlar.** Hafta sonu ve gece yapılan dolumların oranı %5'i aşıyorsa dikkat gerektirir.
- **İstasyon çeşitliliği.** Sürücülerin farklı istasyonları kullanıyor olması normaldir ama tek bir araç her dolumu farklı şehirde yapıyorsa araştırılmalı.
- **Birim fiyat anomalisi.** Aynı hafta içinde aynı ürün için litre başı tutar %10'dan fazla oynuyorsa fiyat listesi veya sahte satır olabilir.

## Benchmark değerler

Ağır TIR ve kamyonlar için Türkiye yolları ortalamaları:

- **Boş sefer:** 22–26 L/100km
- **Orta yük:** 26–30 L/100km
- **Ağır yük + eğimli güzergah:** 30–35 L/100km
- **Şehir içi dağıtım kamyonu (10 ton):** 18–22 L/100km

Aracın profiline göre üst limiti %15 aşan aylar incelemeye değer.

## Üç büyük kart arasında dikkat edilecek farklar

- **OPET**: Şehir bilgisini istasyon adından ayrı bir sütunda verir. Coğrafi rota kontrolü kolaylaşır.
- **Shell**: İşlem zaman damgası saniye hassasiyetindedir. Kısa aralık anomalileri burada daha net çıkar.
- **BP**: Kilometre alanını sürücü girmezse satır boş kalır, ama PDF raporunda çoğu zaman dolu olur. Mümkünse XLSX + PDF karşılaştırın.

## Naklos ne yapar?

Naklos üç sağlayıcının ekstresini de otomatik tanır — sütunları manuel eşlememek için tasarlanmıştır. Dosyayı yükleyin, sistem plakaları normalize eder, ürün filtresini uygular ve aylık anomali raporunu dakikalar içinde verir. GPS veya bakım yazılımı entegrasyonu gerekmez — sadece ekstrenizin standart halini analiz eder.
