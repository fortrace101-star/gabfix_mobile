import { API_BASE_URL, hasApiBaseUrl } from '@/lib/config';
import { getAuthBridge } from '@/lib/api/session-bridge';

/**
 * Shared HTTP core for every Gabfix endpoint. Auth screens use it today; discovery,
 * booking and payment screens are built on the same client in the next phases.
 */
export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 0, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  get isNetworkError() {
    return this.status === 0;
  }

  get isUnauthorized() {
    return this.status === 401;
  }
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  /** Attach the session access token and retry once after a refresh. Default true. */
  auth?: boolean;
  /** Stable key for retry-safe writes (bookings, payments). */
  idempotencyKey?: string;
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 15_000;

const NETWORK_MESSAGE = 'Check your connection and try again.';
const TIMEOUT_MESSAGE = 'The request took too long. Please try again.';
const SERVER_MESSAGE = 'Something went wrong on our side. Please try again.';

type RawResponse = { status: number; ok: boolean; body: unknown; text: string };

const parseBody = (text: string): unknown => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const messageFrom = (status: number, body: unknown): string => {
  if (body && typeof body === 'object' && 'message' in body) {
    const { message } = body as { message?: unknown };
    if (typeof message === 'string' && message.trim().length > 0) return message;
  }
  if (status >= 500) return SERVER_MESSAGE;
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return "You don't have access to that.";
  if (status === 404) return 'We could not find what you asked for.';
  if (status === 429) return 'Too many attempts. Please wait a moment and try again.';
  return 'The request could not be completed. Please try again.';
};

const toApiError = (status: number, body: unknown) => {
  const code =
    body && typeof body === 'object' && 'code' in body && typeof body.code === 'string'
      ? body.code
      : undefined;
  return new ApiError(messageFrom(status, body), status, code);
};

async function send(
  path: string,
  options: RequestOptions,
  accessToken: string | null,
): Promise<RawResponse> {
  const { method = 'GET', body, headers = {}, idempotencyKey, timeoutMs = DEFAULT_TIMEOUT_MS } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await response.text();
    return { status: response.status, ok: response.ok, body: parseBody(text), text };
  } catch {
    if (controller.signal.aborted) {
      throw new ApiError(TIMEOUT_MESSAGE, 0, 'timeout');
    }
    throw new ApiError(NETWORK_MESSAGE, 0, 'network');
  } finally {
    clearTimeout(timeout);
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!hasApiBaseUrl) {
    throw new ApiError('The Gabfix API is not configured.', 0, 'not_configured');
  }

  const { auth = true } = options;
  const bridge = auth ? getAuthBridge() : null;

  let response = await send(path, options, bridge?.getAccessToken() ?? null);

  if (response.status === 401 && bridge) {
    const refreshed = await bridge.refreshSession();
    if (refreshed) {
      response = await send(path, options, bridge.getAccessToken());
    }
    if (response.status === 401) {
      bridge.onUnauthorized();
    }
  }

  if (!response.ok) {
    throw toApiError(response.status, response.body);
  }

  return response.body as T;
}
