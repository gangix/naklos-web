import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock keycloak so importing api.ts doesn't trigger real Keycloak init.
vi.mock('../auth/keycloak', () => ({
  default: { token: undefined },
}));

import { apiCall } from './api';

beforeEach(() => {
  globalThis.fetch = vi.fn();
  // Silence the console.error that apiCall emits on every failure path.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

/**
 * Build a minimal Response-like object that apiCall can consume.
 * We only need ok/status/text() for the error path (no body parsing on success).
 */
function mockErrorResponse(status: number, body: string) {
  return {
    ok: false,
    status,
    text: async () => body,
  };
}

describe('apiCall error handling', () => {
  it('surfaces BE `details` field from a 400 ErrorResponse JSON body', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockErrorResponse(
        400,
        JSON.stringify({
          status: 400,
          message: 'Validation failed',
          details: 'Bu e-posta adresi bu filoda zaten kullanılıyor',
          path: '/api/drivers',
        }),
      ),
    );

    await expect(apiCall('/drivers', { method: 'POST' })).rejects.toThrow(
      'Bu e-posta adresi bu filoda zaten kullanılıyor',
    );
  });

  it('falls back to BE `message` when `details` is missing', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockErrorResponse(
        400,
        JSON.stringify({
          status: 400,
          message: 'Geçersiz plaka formatı',
          path: '/api/trucks',
        }),
      ),
    );

    await expect(apiCall('/trucks', { method: 'POST' })).rejects.toThrow(
      'Geçersiz plaka formatı',
    );
  });

  it('falls back to generic status message when 400 body is not JSON', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockErrorResponse(400, '<html><body>Bad Request</body></html>'),
    );

    await expect(apiCall('/anything')).rejects.toThrow('Geçersiz istek');
  });

  it('surfaces BE `details` even on 500 (BE returned a real reason)', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockErrorResponse(
        500,
        JSON.stringify({
          status: 500,
          message: 'Internal Server Error',
          details: 'Yakıt formatı eşleştirmesi başarısız oldu',
          path: '/api/fleets/x/fuel-imports/preview',
        }),
      ),
    );

    await expect(apiCall('/fleets/x/fuel-imports/preview')).rejects.toThrow(
      'Yakıt formatı eşleştirmesi başarısız oldu',
    );
  });

  it('falls back to generic 5xx message when 500 body is empty', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockErrorResponse(500, ''),
    );

    await expect(apiCall('/anything')).rejects.toThrow(
      'Sunucu hatası, lütfen tekrar deneyin',
    );
  });

  it('ignores `details` when it is an empty string and falls back to generic', async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockErrorResponse(
        400,
        JSON.stringify({ status: 400, message: '', details: '' }),
      ),
    );

    await expect(apiCall('/anything')).rejects.toThrow('Geçersiz istek');
  });
});
