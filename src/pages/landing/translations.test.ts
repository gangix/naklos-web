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

  it('EN and TR landing key sets match exactly', () => {
    expect(trKeys).toEqual(enKeys);
  });

  it('EN and DE landing key sets match exactly', () => {
    expect(deKeys).toEqual(enKeys);
  });

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

  it('required new keys exist in all three locales', () => {
    const required = [
      'landing.howItWorks.eyebrow',
      'landing.howItWorks.title',
      'landing.howItWorks.subtitle',
      'landing.howItWorks.steps.s1.title',
      'landing.howItWorks.steps.s2.title',
      'landing.howItWorks.steps.s3.title',
      'landing.hero.ctaPrimarySub',
      'landing.pricing.foundingBanner',
      'landing.pricing.freeSub',
      'landing.pricing.foundingCta',
      'landing.contact.form.submit',
      'landing.contact.form.consent',
      'landing.contact.form.success',
      'landing.contact.form.errorRateLimit',
      'landing.contact.form.errorGeneric',
      'landing.contact.form.validationRequired',
      'landing.contact.form.validationEmail',
      'landing.contact.form.validationConsent',
    ];
    for (const [name, keys] of [['en', enKeys], ['tr', trKeys], ['de', deKeys]] as const) {
      for (const key of required) {
        expect(keys, `missing required key ${key} in ${name}`).toContain(key);
      }
    }
  });
});
