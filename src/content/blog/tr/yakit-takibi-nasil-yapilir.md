---
slug: yakit-takibi-nasil-yapilir
title: Filo Yakıt Takibi Nasıl Yapılır?
description: OPET, Shell ve BP yakıt kartı ekstrelerinden filo yakıt takibi nasıl yapılır? Adım adım rehber.
date: 2026-04-23
readingTimeMinutes: 5
locale: tr
ogImage: /og/yakit-takibi.png
---

Türkiye'deki nakliyat firmalarının büyük çoğunluğu yakıt takibini Excel'de yapıyor — ya da hiç yapmıyor. Bu rehberde, OPET/Shell/BP ekstrelerinden başlayarak filinizin yakıt verilerini nasıl analiz edeceğinizi adım adım anlatıyoruz.

## Neden yakıt takibi önemli?

Bir nakliyat firmasında yakıt gideri, toplam operasyonel maliyetin genellikle %30–40'ını oluşturur. 15 araçlık bir filoda aylık yakıt harcaması kolaylıkla ₺500.000'i aşabilir. Bu rakamın küçük bir yüzdesi bile — mesela %5'i — kontrolsüz harcandığında aylık ₺25.000 kayıp anlamına gelir.

Yakıt takibinin önemi sadece maliyetten ibaret değil. Türkiye'de yakıt kartı suistimali yaygın bir sorundur: sürücülerin başka araçlara, hatta hiç var olmayan dolumlar için kart kullanması tespit edilmesi güç ama sık karşılaşılan bir durumdur.

## Yakıt kartı ekstresi nedir?

OPET, Shell, BP ve Total gibi büyük akaryakıt firmaları kurumsal müşterilerine yakıt kartı hizmeti sunar. Bu kartlarla yapılan her dolum kayıt altına alınır ve genellikle aylık Excel raporu olarak indirilebilir.

Tipik bir yakıt kartı ekstresi şu bilgileri içerir:

- Tarih ve saat
- Araç plakası
- İstasyon adı ve konumu
- Dolum miktarı (litre)
- Tutar (₺)
- Kilometre sayacı (sürücü girişi — her zaman güvenilir değil)

## Manuel takibin sorunları

Çoğu firma bu ekstreyi Excel'e yapıştırarak takip etmeye çalışır. Sorun şu: bir filoda 15 araç varsa ve her araç ayda ortalama 10 dolum yapıyorsa, aylık 150 satır veri oluşur. Bunları manuel kontrol etmek saatler alır ve hata yapmak kaçınılmazdır.

Manuel takipte en sık kaçırılan durumlar:

- **Tank kapasitesi aşımı:** 80 litrelik depoya 127 litre girilmesi — karta başka araç doldurulmuş olabilir.
- **Kısa aralıklı çifte dolum:** Aynı araç 2 saat içinde iki farklı istasyonda doluyor.
- **Kilometre tutarsızlığı:** Önceki dolumdan sonra kilometre farkı sıfır veya negatif — sahte giriş işareti.
- **L/100km ani artışı:** Belirli bir araç normalde 24 L/100km yakarken bu ay 32 L/100km'ye çıkmış.

## L/100km nasıl hesaplanır?

Yakıt verimliliğinin en temel göstergesi litre/100 km değeridir. Hesaplama basittir:

```
L/100km = (Kullanılan Yakıt (L) ÷ Gidilen Yol (km)) × 100
```

Örnek: Araç son dolumdan bu yana 450 km gitmiş ve 118 litre yakıt kullanmış. L/100km = (118 ÷ 450) × 100 = **26,2 L/100km**

Ağır TIR ve kamyonlar için normal aralık 24–30 L/100km'dir. Bu aralığın üzerine çıkan araçlar dikkat gerektirir.

## Anomali tespiti için pratik kurallar

Elle kontrol etmek yerine şu basit kuralları sistemleştirin:

- **Kural 1 — Tank kapasitesi:** Her aracın maksimum depo kapasitesini kaydedin. Bu miktarı aşan her dolum otomatik şüpheli sayılsın.
- **Kural 2 — Zaman aralığı:** Aynı araç 3 saatten kısa sürede iki kez doldurulduysa işaretleyin.
- **Kural 3 — L/100km eşiği:** Her araç için son 3 aylık ortalama L/100km hesaplayın. Bu ortalamanın %25 üzerine çıkan ayları şüpheli olarak işaretleyin.
- **Kural 4 — Kilometre tutarlılığı:** Art arda iki dolum arasında kilometre farkı 50 km'den azsa veya negatifse hata ya da sahte giriş ihtimali var.

## Otomatik takip için ne kullanabilirsiniz?

Yukarıdaki kuralları her ay manuel uygulamak zahmetlidir. Naklos bu süreci otomatikleştirir: OPET/Shell/BP ekstresinizi yükleyin, sistem anında anomalileri tespit eder ve e-posta ile bildirir. GPS kutusu, terminal veya kurulum gerektirmez — mevcut yakıt kartı Excel'iniz yeterlidir.
