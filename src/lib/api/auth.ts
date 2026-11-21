import { ApiError, apiRequest } from '@/lib/api/client';
import { hasApiBaseUrl } from '@/lib/config';

export type AuthUser = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
};

export type LoginPayload = { identifier: string; password: string };
export type RegisterPayload = {
  name: string;
  phone: string;
  email?: string;
  password: string;
};
export type OtpRequestPayload = { phone: string };
export type OtpVerifyPayload = { phone: string; code: string };
export type RefreshResponse = { accessToken: string; refreshToken?: string };

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Auth endpoints. When EXPO_PUBLIC_API_BASE_URL is not set the app runs against the
 * local mock below so the onboarding flow stays usable without a backend.
 */
export async function login(payload: LoginPayload): Promise<AuthSession> {
  if (!hasApiBaseUrl) {
    await delay(700);
    const phoneLike = /^\+?[0-9\s]+$/.test(payload.identifier.trim());
    return {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: 'mock-user',
        name: phoneLike ? 'Aisha' : payload.identifier.split('@')[0] || 'Aisha',
        phone: phoneLike ? payload.identifier : undefined,
        email: phoneLike ? undefined : payload.identifier,
      },
    };
  }
  return apiRequest<AuthSession>('/auth/login', {
    method: 'POST',
    body: payload,
    auth: false,
  });
}

export async function register(payload: RegisterPayload): Promise<{ ok: true }> {
  if (!hasApiBaseUrl) {
    await delay(700);
    return { ok: true };
  }
  return apiRequest<{ ok: true }>('/auth/register', {
    method: 'POST',
    body: payload,
    auth: false,
  });
}

export async function requestOtp(payload: OtpRequestPayload): Promise<{ ok: true }> {
  if (!hasApiBaseUrl) {
    await delay(400);
    return { ok: true };
  }
  return apiRequest<{ ok: true }>('/auth/otp/request', {
    method: 'POST',
    body: payload,
    auth: false,
  });
}

export async function verifyOtp(payload: OtpVerifyPayload): Promise<AuthSession> {
  if (!hasApiBaseUrl) {
    await delay(700);
    if (payload.code === '000000') {
      throw new ApiError("That code isn't right. Check the SMS and try again.", 400, 'invalid_code');
    }
    return {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: { id: 'mock-user', name: 'Aisha', phone: payload.phone },
    };
  }
  return apiRequest<AuthSession>('/auth/otp/verify', {
    method: 'POST',
    body: payload,
    auth: false,
  });
}

export async function refreshSession(refreshToken: string): Promise<RefreshResponse> {
  if (!hasApiBaseUrl) {
    await delay(200);
    return { accessToken: 'mock-access-token' };
  }
  return apiRequest<RefreshResponse>('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
    auth: false,
  });
}
