/**
 * Breaks the import cycle between the API client and the session store.
 * The session store registers itself once at module load; the client asks it for the
 * current access token and for a refresh when a request comes back 401.
 */
export type AuthBridge = {
  getAccessToken: () => string | null;
  /** Refresh the active session. Resolves true when a new access token is available. */
  refreshSession: () => Promise<boolean>;
  /** Called when a request is still unauthorised after a refresh attempt. */
  onUnauthorized: () => void;
};

let bridge: AuthBridge | null = null;

export const setAuthBridge = (next: AuthBridge) => {
  bridge = next;
};

export const getAuthBridge = (): AuthBridge | null => bridge;
