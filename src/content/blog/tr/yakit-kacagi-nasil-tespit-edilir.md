---
slug: yakit-kacagi-nasil-tespit-edilir
title: Yakıt Kaçağı Nasıl Tespit Edilir?
description: Filoda yakıt kaçağı ve kayıpları veriye dayalı nasıl tespit edilir? Pratik kurallar ve örneklerle rehber.
date: 2026-04-22
readingTimeMinutes: 5
locale: tr
ogImage: /og/yakit-kacagi.png
---

Yakıt kaçağı bir filonun en pahalı gizli maliyetidir. Türkiye'de orta ölçekli bir nakliyat filosunda yakıt kayıpları yıllık ₺300.000 ile ₺1.500.000 arasında değişebilir — ama çoğu firma bu rakamın farkında bile değildir. Bu rehberde, yakıt kartı ekstresi ve kilometre verisini kullanarak kaçağı nasıl tespit edeceğinizi anlatıyoruz.

## Yakıt kaçağı ne demek?

Yakıt kaçağı iki farklı anlama gelir: **fiziksel kaçak** (yakıt tankından sızıntı, çalınan yakıt, hatalı ölçüm) ve **operasyonel kaçak** (kart suistimali, sahte dolumlar, kaydı tutulmayan kullanım). İkisi de aynı bilançoya zarar verir ama farklı yöntemlerle tespit edilir.

Operasyonel kaçak fiziksel kaçaktan çok daha yaygındır. Fiziksel bir tank sızıntısı nadirdir; ama sürücünün başka araca dolum yapması, arkadaş aracına yakıt vermesi veya sahte kilometre girişiyle fazladan dolum alması neredeyse her filoda görülür.

## En yaygın kaçak desenleri

Gerçek filo verilerinde karşılaştığımız tipik kaçak izleri:

- **Hayalet dolum:** Kilometre sayacı değişmeden ardı ardına iki dolum yapılmış. Araç park halindeyken kart kullanılmış olabilir.
- **Kapasite aşımı:** 300 litrelik depoya 327 litre girmiş. Tankın almayacağı kadar yakıt başka bir depoya aktarılmış demektir.
- **Mesai dışı dolum:** Sürücünün çalışma saatleri dışında (örneğin gece 02:00'de) şehir dışı istasyondan dolum.
- **Tekrarlı kısa aralık:** Aynı araç 4 saat içinde iki farklı istasyonda dolum yapmış.
- **Tutarsız rota:** Rotası İstanbul–Ankara olan araç, aynı gün İzmir istasyonundan dolum görünüyor.

## Kilometre verisi neden kritik?

Fiziksel kaçağı tespit etmenin tek güvenilir yolu yakıt tüketim oranını (L/100km) izlemektir. Eğer bir araç aylardır 25 L/100km yakıyorken birden 33 L/100km'ye çıkıyorsa, üç olasılık vardır:

1. Yakıt sisteminde fiziksel bir sorun (enjektör, filtre, hava kaçağı).
2. Sürücü değişimi — yeni sürücü daha agresif gaz kullanıyor.
3. Kart suistimali — yakıtın bir kısmı araca girmiyor.

Kilometre bilgisi genelde sürücü tarafından pompada girilir ve her zaman güvenilir değildir. Sürücü kilometre şişirirse L/100km yapay olarak düşer ve fazladan yakıt "normal" gösterilebilir. Bu yüzden mümkünse araç GPS'inden veya servis bakım verisinden alınan kilometreyi esas almak gerekir.

## Basit ama güçlü tespit kuralları

Ekstreyi elle incelemek yerine şu kuralları otomatikleştirin:

- **Kural 1 — Kapasite sınırı:** Her aracın maksimum depo kapasitesinin %5 üzerine çıkan dolumları otomatik işaretleyin.
- **Kural 2 — Zaman aralığı:** 3 saatten kısa sürede iki farklı dolum yapılmışsa uyarı üretin.
- **Kural 3 — Tüketim sapması:** Son 90 günün ortalamasının %20 üzerinde L/100km ay işaretlensin.
- **Kural 4 — Mesai dışı dolum:** Çalışma saatleri dışındaki tüm dolumları ayrı rapora alın.
- **Kural 5 — Coğrafi tutarlılık:** Aracın o günkü rota verisiyle dolum yapılan istasyon şehri uyuşmalı.

## Gerçek bir örnek

15 araçlık bir filoda üç ay boyunca elde edilen verilerde şu tespitleri yaptık:

- 2 araçta kapasite aşımı: aylık ortalama ₺8.400 kayıp.
- 1 araçta kilometre tutarsızlığı: yaklaşık ₺4.200 şüpheli dolum.
- 3 dolum mesai dışı ve rota dışı: ₺3.100.

Toplam 3 aylık kayıp: **₺47.100**. Yıllık projeksiyon: ₺188.000 civarı — bu filonun net kârının yaklaşık %6'sı.

## Manuel takibin limiti

Bu kuralları Excel'de kurmak teoride mümkün ama pratikte sürdürülebilir değil. Her ay 10–15 formüllü sayfayı açıp güncellemek, pivot tablo yenilemek ve araç listesi değiştiğinde her şeyi yeniden kurmak — bu işi hiç kimsenin gerçekten yapmadığını biliyoruz. Sonuçta Excel sayfası bir süre sonra terk edilir.

## Naklos ne yapar?

Naklos yakıt kartı ekstrenizi (OPET, Shell, BP, Total) yüklemenizi ister ve yukarıdaki kuralları otomatik çalıştırır. Kurulum, GPS kutusu veya sürücü uygulaması gerekmez — sadece ekstre. İlk anomaliler dakikalar içinde raporlanır ve şüpheli dolumlar e-postayla filo yöneticisine iletilir.
