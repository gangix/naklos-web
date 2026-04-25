import type { FoundingStatus } from '../types/founding';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api';

/**
 * Public, unauthenticated endpoints (marketing data only). Doesn't go
 * through `apiCall` because that injects auth headers — public endpoints
 * skip them. Errors are swallowed; callers fall back to a default state.
 */
export const publicApi = {
  async foundingStatus(): Promise<FoundingStatus | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/public/founding-status`);
      if (!res.ok) return null;
      return (await res.json()) as FoundingStatus;
    } catch {
      return null;
    }
  },
};
