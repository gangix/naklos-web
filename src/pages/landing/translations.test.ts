import { describe, it, expect } from 'vitest';
import en from '../../../public/locales/en/translation.json';
import tr from '../../../public/locales/tr/translation.json';
import de from '../../../public/locales/de/translation.json';

function flattenKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return [];
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flattenKeys(v, full));
    } else {
      keys.push(full);
    }
  }
  return keys;
}

describe('landing translations alignment', () => {
  const enKeys = flattenKeys((en as { landing: unknown }).landing, 'landing').sort();
  const trKeys = flattenKeys((tr as { landing: unknown }).landing, 'landing').sort();
  const deKeys = flattenKeys((de as { landing: unknown }).landing, 'landing').sort();

  // Per the 2026-04-25 landing-rewrite spec, the new landing ships TR-first.
  // EN and DE still carry the older landing copy and will be brought back into
  // alignment with TR in a follow-up plan. Until then, strict EN/TR/DE key-set
  // parity is intentionally out of scope.
  //
  // Two gates remain:
  //   1. Forbidden keys: catches dead references that should have been removed.
  //   2. Required new keys (TR only): catches accidental deletion of keys the
  //      new landing components actually consume at runtime.

  it('no dropped keys remain in any locale', () => {
    const forbidden = [
      'landing.audit',
      'landing.whatsappFloat',
      'landing.pricing.startFree',
      'landing.pricing.features.fuelPerformanceDenied',
      'landing.contact.cta',
    ];
    for (const [name, keys] of [['en', enKeys], ['tr', trKeys], ['de', deKeys]] as const) {
      for (const prefix of forbidden) {
        const hit = keys.filter((k: string) => k === prefix || k.startsWith(prefix + '.'));
        expect(hit, `${name} contains forbidden ${prefix}`).toEqual([]);
      }
    }
  });

  it('required new landing keys exist in TR (source-of-truth locale)', () => {
    const required = [
      // Hero
      'landing.hero.title1',
      'landing.hero.title2',
      'landing.hero.title3',
      'landing.hero.subtitle',
      'landing.hero.cta',
      'landing.hero.trustNoCard',
      'landing.hero.trustKvkk',
      'landing.hero.trustSupport',
      'landing.hero.trustNoHardware',
      'landing.betaPill',

      // Three pillars
      'landing.features.eyebrow',
      'landing.features.title',
      'landing.features.docs.title',
      'landing.features.fuel.title',
      'landing.features.maintenance.title',

      // Pricing
      'landing.pricing.eyebrow',
      'landing.pricing.title',
      'landing.pricing.subtitle',
      'landing.pricing.betaBanner',
      'landing.pricing.free.title',
      'landing.pricing.pro.title',
      'landing.pricing.pro.standardPrice',
      'landing.pricing.pro.foundingPrice',
      'landing.pricing.enterprise.title',
      'landing.pricing.enterprise.price',
      'landing.pricing.enterprise.cta',

      // FAQ
      'landing.faq.eyebrow',
      'landing.faq.title',
      'landing.faq.q1.q',
      'landing.faq.q1.a',
      'landing.faq.q6.q',
      'landing.faq.q6.a',

      // Final CTA
      'landing.finalCta.title1',
      'landing.finalCta.title2',
      'landing.finalCta.title3',
      'landing.finalCta.subtitle',
      'landing.finalCta.cta',

      // Nav + footer
      'landing.nav.features',
      'landing.nav.comparison',
      'landing.nav.pricing',
      'landing.nav.faq',
      'landing.nav.login',
      'landing.footer.copyright',
      'landing.footer.kvkk',
      'landing.footer.terms',
      'landing.footer.contact',
      'landing.footer.blog',
    ];
    for (const key of required) {
      expect(trKeys, `missing required key ${key} in tr`).toContain(key);
    }
  });
});
