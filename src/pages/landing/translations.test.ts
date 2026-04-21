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

  // Full-file key sets for top-level sections (e.g. foundingTerms)
  const enAllKeys = flattenKeys(en).sort();
  const trAllKeys = flattenKeys(tr).sort();
  const deAllKeys = flattenKeys(de).sort();

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
      'landing.hero.preview.alerts.today',
      'landing.hero.preview.alerts.fuelTitle',
      'landing.hero.preview.alerts.docTitle',
      'landing.hero.preview.alerts.driverTitle',
      'landing.pricing.futureLabel',
      'landing.pricing.lockInLabel',
      'landing.pricing.termsLinkLabel',
      'landing.pricing.ownerLockInPrice',
      'landing.pricing.businessLockInPrice',
      'landing.socialProof.eyebrow',
      'landing.socialProof.title',
      'landing.socialProof.body',
      'landing.socialProof.cta',
      'foundingTerms.title',
      'foundingTerms.draftBanner',
      'foundingTerms.point1',
      'foundingTerms.contact',
      'landing.footer.legalHeading',
      'landing.footer.kvkk',
      'landing.footer.cookies',
      'landing.footer.foundingTerms',
      'kvkkPage.title',
      'kvkkPage.placeholder',
      'cookiePage.title',
      'cookiePage.placeholder',
    ];
    for (const [name, keys] of [['en', enAllKeys], ['tr', trAllKeys], ['de', deAllKeys]] as const) {
      for (const key of required) {
        expect(keys, `missing required key ${key} in ${name}`).toContain(key);
      }
    }
  });
});
