/* eslint-disable @typescript-eslint/no-require-imports */
jest.mock('@/lib/session-storage', () => ({
  loadSession: jest.fn(),
  saveSession: jest.fn(),
}));

jest.mock('@/lib/api/auth', () => ({
  refreshSession: jest.fn(),
}));

type SessionModule = typeof import('@/store/session');
type StorageMock = {
  loadSession: jest.Mock;
  saveSession: jest.Mock;
};
type AuthMock = { refreshSession: jest.Mock };
type BridgeModule = typeof import('@/lib/api/session-bridge');

const storedSession = {
  accessToken: 'token-1',
  refreshToken: 'refresh-1',
  user: { id: 'u1', name: 'Aisha Nakato', phone: '+256700000000' },
};

/** Fresh module instance per test so status does not leak between cases. */
const load = (): {
  storage: StorageMock;
  auth: AuthMock;
  session: SessionModule;
  bridge: BridgeModule;
} => {
  jest.resetModules();
  const storage = require('@/lib/session-storage') as unknown as StorageMock;
  const auth = require('@/lib/api/auth') as unknown as AuthMock;
  const session = require('@/store/session') as SessionModule;
  const bridge = require('@/lib/api/session-bridge') as BridgeModule;
  return { storage, auth, session, bridge };
};

describe('session store', () => {
  it('starts in the loading state until the stored session is read', () => {
    const { session } = load();
    expect(session.getSessionState()).toEqual({ status: 'loading', session: null });
  });

  it('restores a persisted session at boot', async () => {
    const { session, storage } = load();
    storage.loadSession.mockResolvedValue(storedSession);

    await session.restoreSession();

    expect(session.getSessionState()).toEqual({
      status: 'authenticated',
      session: storedSession,
    });
  });

  it('lands on unauthenticated when nothing is stored', async () => {
    const { session, storage } = load();
    storage.loadSession.mockResolvedValue(null);

    await session.restoreSession();

    expect(session.getSessionState()).toEqual({ status: 'unauthenticated', session: null });
  });

  it('persists the session returned by login or OTP verification', async () => {
    const { session, storage } = load();

    await session.startSession(storedSession);

    expect(session.getSessionState().status).toBe('authenticated');
    expect(storage.saveSession).toHaveBeenCalledWith(storedSession);
  });

  it('clears both the state and the stored tokens on sign-out', async () => {
    const { session, storage } = load();
    await session.startSession(storedSession);

    await session.endSession();

    expect(session.getSessionState()).toEqual({ status: 'unauthenticated', session: null });
    expect(storage.saveSession).toHaveBeenLastCalledWith(null);
  });

  it('refreshes once for concurrent 401s and keeps the refresh token', async () => {
    const { session, storage, auth, bridge } = load();
    await session.startSession(storedSession);
    auth.refreshSession.mockResolvedValue({ accessToken: 'token-2' });

    const [first, second] = await Promise.all([
      bridge.getAuthBridge()?.refreshSession(),
      bridge.getAuthBridge()?.refreshSession(),
    ]);

    expect(first).toBe(true);
    expect(second).toBe(true);
    expect(auth.refreshSession).toHaveBeenCalledTimes(1);
    expect(session.getSessionState().session).toMatchObject({
      accessToken: 'token-2',
      refreshToken: 'refresh-1',
    });
    expect(storage.saveSession).toHaveBeenLastCalledWith(
      expect.objectContaining({ accessToken: 'token-2' }),
    );
  });

  it('adopts a rotated refresh token', async () => {
    const { session, auth, bridge } = load();
    await session.startSession(storedSession);
    auth.refreshSession.mockResolvedValue({ accessToken: 'token-2', refreshToken: 'refresh-2' });

    await bridge.getAuthBridge()?.refreshSession();

    expect(session.getSessionState().session).toMatchObject({
      accessToken: 'token-2',
      refreshToken: 'refresh-2',
    });
  });

  it('signs out when the refresh token is no longer valid', async () => {
    const { session, storage, auth, bridge } = load();
    await session.startSession(storedSession);
    auth.refreshSession.mockRejectedValue(new Error('refresh expired'));

    await expect(bridge.getAuthBridge()?.refreshSession()).resolves.toBe(false);

    expect(session.getSessionState().status).toBe('unauthenticated');
    expect(storage.saveSession).toHaveBeenLastCalledWith(null);
  });

  it('has nothing to refresh without a session', async () => {
    const { session, auth, bridge } = load();
    await session.restoreSession();

    await expect(bridge.getAuthBridge()?.refreshSession()).resolves.toBe(false);
    expect(auth.refreshSession).not.toHaveBeenCalled();
  });

  it('drops the session when the API reports it is no longer authorised', async () => {
    const { session, storage, bridge } = load();
    await session.startSession(storedSession);

    bridge.getAuthBridge()?.onUnauthorized();
    await Promise.resolve();

    expect(session.getSessionState().status).toBe('unauthenticated');
    expect(storage.saveSession).toHaveBeenLastCalledWith(null);
  });
});
