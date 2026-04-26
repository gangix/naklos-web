export type PlanCode = 'FREE' | 'PRO' | 'ENTERPRISE';
export type ResourceKey = 'truck' | 'driver' | 'client';

// -1 = unlimited. Mirrors backend PlanLimits.of().
export const PLAN_LIMITS: Record<PlanCode, Record<ResourceKey, number>> = {
  FREE:       { truck: 3,   driver: 3,   client: 3 },
  PRO:        { truck: 100, driver: 100, client: -1 },
  ENTERPRISE: { truck: -1,  driver: -1,  client: -1 },
};

export const PLAN_NEXT: Record<PlanCode, PlanCode | ''> = {
  FREE: 'PRO',
  PRO: 'ENTERPRISE',
  ENTERPRISE: '',
};

export function planOf(code: string | undefined | null): PlanCode {
  return (code && code in PLAN_LIMITS ? code : 'FREE') as PlanCode;
}

export function limitOf(plan: PlanCode, resource: ResourceKey): number {
  return PLAN_LIMITS[plan][resource];
}
