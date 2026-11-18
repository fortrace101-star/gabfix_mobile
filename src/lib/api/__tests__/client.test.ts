/* eslint-disable @typescript-eslint/no-require-imports */
import { ApiError, apiRequest } from '@/lib/api/client';
import { setAuthBridge } from '@/lib/api/session-bridge';

jest.mock('@/lib/config', () => ({
  API_BASE_URL: 'https://api.gabfix.test',
  hasApiBaseUrl: true,
}));

type FetchCall = { url: string; init: RequestInit };

const fetchMock = jest.fn<Promise<Response>, [string, RequestInit]>();

globalThis.fetch = fetchMock as unknown as typeof fetch;

const respond = (status: number, body: unknown = null): Response =>
  ({
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === null ? '' : JSON.stringify(body)),
  }) as unknown as Response;

const bodyOf = (call: FetchCall) => JSON.parse(String(call.init.body));

let accessToken: string | null;
let refreshSession: jest.Mock;
let onUnauthorized: jest.Mock;

beforeEach(() => {
  fetchMock.mockReset();
  accessToken = 'token-1';
  refreshSession = jest.fn();
  onUnauthorized = jest.fn();
  setAuthBridge({
    getAccessToken: () => accessToken,
    refreshSession,
    onUnauthorized,
  });
});

describe('apiRequest', () => {
  it('calls the configured base URL with the access token and parses JSON', async () => {
    fetchMock.mockResolvedValueOnce(respond(200, { id: 'bkg_1' }));

    const result = await apiRequest<{ id: string }>('/bookings/bkg_1');

    expect(result).toEqual({ id: 'bkg_1' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.gabfix.test/bookings/bkg_1');
    expect(init.method).toBe('GET');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer token-1');
  });

  it('serialises the body and forwards an idempotency key on writes', async () => {
    fetchMock.mockResolvedValueOnce(respond(201, { id: 'bkg_2' }));

    await apiRequest('/bookings', {
      method: 'POST',
      body: { serviceSlug: 'deep-clean' },
      idempotencyKey: 'draft-123',
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(bodyOf({ url: '', init })).toEqual({ serviceSlug: 'deep-clean' });
    expect((init.headers as Record<string, string>)['Idempotency-Key']).toBe('draft-123');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('refreshes once on 401 and retries with the new access token', async () => {
    fetchMock
      .mockResolvedValueOnce(respond(401, { message: 'expired' }))
      .mockResolvedValueOnce(respond(200, { ok: true }));
    refreshSession.mockImplementation(async () => {
      accessToken = 'token-2';
      return true;
    });

    await expect(apiRequest('/me')).resolves.toEqual({ ok: true });

    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((fetchMock.mock.calls[1][1].headers as Record<string, string>).Authorization).toBe(
      'Bearer token-2',
    );
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('reports the session as ended when the refresh fails', async () => {
    fetchMock.mockResolvedValueOnce(respond(401, { message: 'expired' }));
    refreshSession.mockResolvedValue(false);

    await expect(apiRequest('/me')).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('ends the session when the retry is still unauthorised', async () => {
    fetchMock
      .mockResolvedValueOnce(respond(401, {}))
      .mockResolvedValueOnce(respond(401, {}));
    refreshSession.mockResolvedValue(true);

    await expect(apiRequest('/me')).rejects.toBeInstanceOf(ApiError);
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does not send a token or try to refresh for public endpoints', async () => {
    fetchMock.mockResolvedValueOnce(respond(401, { message: 'Wrong password' }));

    await expect(
      apiRequest('/auth/login', { method: 'POST', body: { identifier: 'a', password: 'b' }, auth: false }),
    ).rejects.toMatchObject({ status: 401, message: 'Wrong password' });

    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
    expect(refreshSession).not.toHaveBeenCalled();
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('surfaces the server message, then falls back to a friendly one', async () => {
    fetchMock
      .mockResolvedValueOnce(respond(422, { message: 'That phone number is already registered' }))
      .mockResolvedValueOnce(respond(503))
      .mockResolvedValueOnce(respond(429, null));

    await expect(apiRequest('/auth/register', { method: 'POST', auth: false })).rejects.toThrow(
      'That phone number is already registered',
    );
    await expect(apiRequest('/bookings', { auth: false })).rejects.toThrow(
      'Something went wrong on our side. Please try again.',
    );
    await expect(apiRequest('/bookings', { auth: false })).rejects.toThrow(
      'Too many attempts. Please wait a moment and try again.',
    );
  });

  it('marks connection failures as network errors', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Network request failed'));

    await expect(apiRequest('/me')).rejects.toMatchObject({
      status: 0,
      code: 'network',
      message: 'Check your connection and try again.',
    });
  });

  it('refuses to call a network when no API base URL is configured', async () => {
    jest.resetModules();
    jest.doMock('@/lib/config', () => ({ API_BASE_URL: '', hasApiBaseUrl: false }));

    const { apiRequest: unconfigured, ApiError: UnconfiguredError } = require('@/lib/api/client');

    await expect(unconfigured('/me')).rejects.toBeInstanceOf(UnconfiguredError);
    await expect(unconfigured('/me')).rejects.toMatchObject({ code: 'not_configured' });
    expect(fetchMock).not.toHaveBeenCalled();

    jest.dontMock('@/lib/config');
  });
});
