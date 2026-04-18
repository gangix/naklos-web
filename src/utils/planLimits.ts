export type PlanCode = 'FREE' | 'PROFESSIONAL' | 'BUSINESS' | 'ENTERPRISE';
export type ResourceKey = 'truck' | 'driver' | 'client';

// -1 = unlimited. Mirrors backend PlanLimits.of().
export const PLAN_LIMITS: Record<PlanCode, Record<ResourceKey, number>> = {
  FREE:         { truck: 5,   driver: 5,   client: 3 },
  PROFESSIONAL: { truck: 25,  driver: 25,  client: -1 },
  BUSINESS:     { truck: 100, driver: 100, client: -1 },
  ENTERPRISE:   { truck: -1,  driver: -1,  client: -1 },
};

export const PLAN_NEXT: Record<PlanCode, PlanCode | ''> = {
  FREE: 'PROFESSIONAL',
  PROFESSIONAL: 'BUSINESS',
  BUSINESS: 'ENTERPRISE',
  ENTERPRISE: '',
};

export function planOf(code: string | undefined | null): PlanCode {
  return (code && code in PLAN_LIMITS ? code : 'FREE') as PlanCode;
}

export function limitOf(plan: PlanCode, resource: ResourceKey): number {
  return PLAN_LIMITS[plan][resource];
}
