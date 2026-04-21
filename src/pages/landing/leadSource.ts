// Tracks which landing surface triggered a ContactForm submission.
// Pricing's "Enterprise" CTA calls setLeadSource('enterprise-pricing')
// before scrolling to #contact. ContactForm reads this on submit and
// resets to 'contact' after.
export type LeadSource = 'contact' | 'enterprise-pricing';

let current: LeadSource = 'contact';

export const getLeadSource = (): LeadSource => current;
export const setLeadSource = (source: LeadSource): void => {
  current = source;
};
export const resetLeadSource = (): void => {
  current = 'contact';
};
