import type { PageId } from '../types';

export type AdminRole = 'admin' | 'operations';

export type AdminUser = {
  name: string;
  email: string;
  role: AdminRole;
  initials: string;
};

type Account = AdminUser & { password: string };

/**
 * Demo credentials until the admin API issues real sessions (Open item 29). The
 * operations role can run day-to-day work; only the admin role can open Settings.
 */
const ACCOUNTS: Account[] = [
  {
    name: 'Manuel P.',
    email: 'admin@gabfix.ug',
    role: 'admin',
    initials: 'MP',
    password: 'gabfix2026',
  },
  {
    name: 'Sarah N.',
    email: 'ops@gabfix.ug',
    role: 'operations',
    initials: 'SN',
    password: 'dispatch2026',
  },
];

const SESSION_KEY = 'gabfix.admin.session.v1';

export const roleLabel = (role: AdminRole): string =>
  role === 'admin' ? 'Owner · full access' : 'Operations · no settings';

const isUser = (value: unknown): value is AdminUser => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<AdminUser>;
  return (
    typeof candidate.name === 'string' &&
    typeof candidate.email === 'string' &&
    (candidate.role === 'admin' || candidate.role === 'operations')
  );
};

/** Reads the tab-scoped session so a refresh keeps the operator signed in. */
export function readSession(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isUser(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function signIn(email: string, password: string): { user: AdminUser } | { error: string } {
  const normalised = email.trim().toLowerCase();
  const account = ACCOUNTS.find((item) => item.email === normalised);
  if (!account || account.password !== password) {
    return { error: 'That email and password do not match an operations account.' };
  }
  const user: AdminUser = {
    name: account.name,
    email: account.email,
    role: account.role,
    initials: account.initials,
  };
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    // A blocked storage API should not prevent a demo sign-in.
  }
  return { user };
}

export function signOut(): void {
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Ignore storage failures; the in-memory session is cleared by the caller.
  }
}

/** Settings is owner-only; every other module is available to operations. */
export const canViewPage = (page: PageId, role: AdminRole): boolean =>
  role === 'admin' || page !== 'settings';
