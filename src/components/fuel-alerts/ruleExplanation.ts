import type { AnomalyPendingItem } from '../../types/fuelAnomaly';

/** Safe JSON.parse — returns an untyped object or {} on failure. */
function parseContext(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw);
    return obj && typeof obj === 'object' ? (obj as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' && !isNaN(v)) return v;
  if (typeof v === 'string' && v.trim() !== '') {
    const n = Number(v);
    return isNaN(n) ? null : n;
  }
  return null;
}

function fmtLiters(v: number | null, digits = 1): string {
  if (v === null) return '—';
  return v.toLocaleString('tr-TR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function fmtKm(v: number | null): string {
  if (v === null) return '—';
  return v.toLocaleString('tr-TR', { maximumFractionDigits: 0 });
}

/** Short one-line plain-Turkish explanation for the alert card body.
 *  Keep under ~160 chars so it fits on two lines on desktop. */
export function shortExplanation(alert: AnomalyPendingItem): string {
  const ctx = parseContext(alert.contextJson);
  const { ruleCode } = alert;

  switch (ruleCode) {
    case 'VOLUME_EXCEEDS_TANK_CAPACITY': {
      const liters = num(ctx.liters) ?? num(alert.liters);
      const cap = num(ctx.tankCapacityLiters);
      if (liters !== null && cap !== null) {
        return `Araca ${fmtLiters(liters)} L alındı; tank kapasitesi ${fmtKm(cap)} L.`;
      }
      return 'Dolum, tanımlı tank kapasitesinin üstünde.';
    }
    case 'ODOMETER_ROLLBACK': {
      const cur = num(ctx.currentOdo) ?? num(ctx.currentOdometerKm) ?? num(alert.reportedOdometerKm);
      const prev = num(ctx.previousOdo) ?? num(ctx.previousOdometerKm);
      if (cur !== null && prev !== null) {
        return `Kilometre ${fmtKm(prev)} → ${fmtKm(cur)} olarak girilmiş (geri gidiş).`;
      }
      return 'Kilometre önceki kayıttan küçük — odometre geriye gitmez.';
    }
    case 'FUEL_TYPE_MISMATCH': {
      const entered = (ctx.enteredFuelType ?? ctx.fuelType) as string | undefined;
      const expected = (ctx.expectedFuelType ?? ctx.truckFuelType) as string | undefined;
      if (entered && expected) {
        return `Girilen: ${entered}; araç: ${expected}. Yakıt türü uyuşmuyor.`;
      }
      return 'Dolumdaki yakıt türü, aracın yakıt türüyle uyuşmuyor.';
    }
    case 'CONSUMPTION_OVER_BASELINE': {
      const actual = num(ctx.actualLPer100Km) ?? num(ctx.actual);
      const baseline = num(ctx.baselineLPer100Km) ?? num(ctx.baseline);
      if (actual !== null && baseline !== null) {
        return `Bu dolumda 100 km'de ${fmtLiters(actual)} L — ortalama ${fmtLiters(baseline)} L.`;
      }
      return 'Beklenenden fazla yakıt tüketilmiş.';
    }
    case 'CONSUMPTION_UNDER_BASELINE': {
      const actual = num(ctx.actualLPer100Km) ?? num(ctx.actual);
      const baseline = num(ctx.baselineLPer100Km) ?? num(ctx.baseline);
      if (actual !== null && baseline !== null) {
        return `Bu dolumda 100 km'de ${fmtLiters(actual)} L — ortalama ${fmtLiters(baseline)} L.`;
      }
      return 'Beklenenden az yakıt tüketilmiş — kayıt eksik olabilir.';
    }
    case 'RAPID_REFUEL': {
      const hours = num(ctx.hoursBetween);
      const km = num(ctx.kmBetween);
      if (hours !== null) {
        return `Önceki dolumdan ${fmtLiters(hours, 1)} saat sonra yeniden dolum (${km !== null ? fmtKm(km) + ' km' : 'kısa mesafe'}).`;
      }
      return 'Önceki dolumdan kısa süre sonra tekrar dolum yapılmış.';
    }
    case 'EXCESSIVE_DAILY_FREQUENCY': {
      const count = num(ctx.count) ?? num(ctx.dailyCount);
      if (count !== null) {
        return `Aynı günde ${fmtKm(count)} dolum yapılmış.`;
      }
      return 'Aynı günde alışılmadık sayıda dolum var.';
    }
    case 'OFF_HOURS_PURCHASE': {
      const hour = num(ctx.hourOfDay);
      if (hour !== null) {
        return `Dolum saat ${String(hour).padStart(2, '0')}:00 civarında — mesai dışı.`;
      }
      return 'Dolum çalışma saatleri dışında yapılmış.';
    }
    case 'ODOMETER_NOT_ADVANCING': {
      const cur = num(ctx.currentOdo) ?? num(alert.reportedOdometerKm);
      if (cur !== null) {
        return `Kilometre önceki kayıttan değişmemiş (${fmtKm(cur)} km).`;
      }
      return 'Kilometre, önceki dolumdan beri ilerlememiş.';
    }
    case 'IMPLAUSIBLE_VOLUME_FOR_TYPE': {
      const liters = num(ctx.liters) ?? num(alert.liters);
      const type = ctx.fuelType as string | undefined;
      if (liters !== null && type) {
        return `${type} için ${fmtLiters(liters)} L mantıksız büyüklükte.`;
      }
      return 'Bu yakıt türü için kayıtlı miktar alışılmadık.';
    }
    case 'PRICE_MATH_MISMATCH': {
      const expected = num(ctx.expectedTotal);
      const actual = num(ctx.actualTotal) ?? num(alert.totalPrice);
      if (expected !== null && actual !== null) {
        return `Tutar ₺${fmtLiters(actual, 2)} girilmiş; fiyat × litre = ₺${fmtLiters(expected, 2)}.`;
      }
      return 'Tutar, birim fiyat × litre ile uyuşmuyor.';
    }
    case 'MISSING_BASELINE':
      return 'Bu araç için ortalama tüketim henüz hesaplanamadı (yeterli veri yok).';
    default:
      return 'Bu dolum için bir anomali tespit edildi.';
  }
}

/** Richer plain-Turkish explanation for the detail modal. 1–2 sentences;
 *  acknowledges the signal and offers a reassuring interpretation. */
export function richExplanation(alert: AnomalyPendingItem): string {
  const ctx = parseContext(alert.contextJson);
  const { ruleCode } = alert;

  switch (ruleCode) {
    case 'VOLUME_EXCEEDS_TANK_CAPACITY': {
      const liters = num(ctx.liters) ?? num(alert.liters);
      const cap = num(ctx.tankCapacityLiters);
      if (liters !== null && cap !== null) {
        return `Araca ${fmtLiters(liters)} L yakıt alındığı kaydedilmiş — ama bu aracın tank kapasitesi ${fmtKm(cap)} L olarak tanımlı. Bir araca tankından fazla yakıt sığmaz; muhtemelen fiş yanlış okunmuş ya da tank kapasitesi eksik.`;
      }
      return 'Bu dolum, aracın tanımlı tank kapasitesinden büyük. Tank kapasitesini kontrol et ya da fiş girdisini düzelt.';
    }
    case 'ODOMETER_ROLLBACK': {
      const cur = num(ctx.currentOdo) ?? num(ctx.currentOdometerKm) ?? num(alert.reportedOdometerKm);
      const prev = num(ctx.previousOdo) ?? num(ctx.previousOdometerKm);
      if (cur !== null && prev !== null) {
        const diff = prev - cur;
        return `Kilometre ${fmtKm(prev)} → ${fmtKm(cur)} olarak girilmiş (${fmtKm(diff)} km geriye). Odometre mekanik olarak geri gitmez — ya şu anki kayıt ya da önceki kayıt yanlış.`;
      }
      return 'Bu dolumun kilometresi, aracın önceki dolumundan daha küçük. Odometre geri gitmez — kayıtlardan birinde hata olabilir.';
    }
    case 'FUEL_TYPE_MISMATCH':
      return 'Dolumdaki yakıt türü, aracın tanımlı yakıt türüyle uyuşmuyor. Yanlış araca fiş girilmiş ya da yakıt türü seçeneği yanlış olabilir.';
    case 'CONSUMPTION_OVER_BASELINE': {
      const actual = num(ctx.actualLPer100Km) ?? num(ctx.actual);
      const baseline = num(ctx.baselineLPer100Km) ?? num(ctx.baseline);
      if (actual !== null && baseline !== null) {
        const pct = Math.round(((actual - baseline) / baseline) * 100);
        return `Bu araç 100 km'de ortalama ${fmtLiters(baseline)} L yakıyor — bu dolumda ${fmtLiters(actual)} L/100 km'e çıktı (%${pct} fazla). Çamurlu yol, yokuş, büyük yük ya da dur-kalk trafik gibi nedenler olabilir.`;
      }
      return 'Bu dolumda beklenenden belirgin şekilde fazla yakıt tüketilmiş. Şoförle konuşup sürüş koşullarını teyit etmek faydalı olabilir.';
    }
    case 'CONSUMPTION_UNDER_BASELINE':
      return 'Bu dolumda beklenenden az yakıt tüketilmiş görünüyor. Genelde eksik kilometre girişinden ya da kayıp bir dolum fişinden kaynaklanır.';
    case 'RAPID_REFUEL':
      return 'Önceki dolumdan çok kısa süre sonra ikinci bir dolum yapılmış. Yakıt hırsızlığı, yanlış giriş ya da uzun sefer sonrası ikinci dolum olabilir.';
    case 'EXCESSIVE_DAILY_FREQUENCY':
      return 'Aynı gün içinde alışılmadık sayıda dolum kaydedilmiş. Bu araç için fazlasıyla sık görünüyor; bir dolumun yanlış araca atanmış olma ihtimali var.';
    case 'OFF_HOURS_PURCHASE':
      return 'Bu dolum, filonun çalışma saatleri dışında yapılmış. Genelde gece çalışan bir şoför için normal olabilir — ama değilse, kontrol etmeye değer.';
    case 'ODOMETER_NOT_ADVANCING':
      return 'Kilometre, önceki dolumdan beri ilerlememiş. Araç uzun süredir park halinde olabilir ya da odometre girişi eksik kalmış olabilir.';
    case 'IMPLAUSIBLE_VOLUME_FOR_TYPE':
      return 'Bu yakıt türü için kayıtlı miktar olağan dışı büyük ya da küçük. Yakıt türü seçimi hatalı olabilir ya da fiş yanlış okunmuş olabilir.';
    case 'PRICE_MATH_MISMATCH':
      return 'Kayıtlı tutar, birim fiyat × litre sonucuyla uyuşmuyor. Genelde fiş üzerindeki sayılardan birinin yanlış girilmiş olduğunu gösterir.';
    case 'MISSING_BASELINE':
      return 'Bu araç için henüz bir ortalama tüketim hesaplanmadı — yeterli dolum geçmişi yok. Daha fazla dolum birikince otomatik olarak tahmin oluşacak, o zamana dek aşırı/az tüketim uyarıları bu araç için kapalı kalır.';
    default:
      return 'Bu dolumda bir anomali tespit edildi. Fiş görselini ve kayıt detaylarını kontrol etmek faydalı olabilir.';
  }
}
