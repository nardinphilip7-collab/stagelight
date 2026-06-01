const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface AuthUser {
  user_id: number;
  role: 'ARTIST' | 'HIRER' | 'AGENCY' | 'FAN';
  email: string;
  exp: number;
}

function decodeToken(token: string): AuthUser | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded as AuthUser;
  } catch {
    return null;
  }
}

export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('sl_access');
  if (!token) return null;
  return decodeToken(token);
}

export function isAuthenticated(): boolean {
  const user = getUser();
  if (!user) return false;
  return user.exp * 1000 > Date.now();
}

function setAuthCookie() {
  document.cookie = 'sl_authed=1; path=/; SameSite=Lax';
}

function clearAuthCookie() {
  document.cookie = 'sl_authed=; Max-Age=0; path=/';
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Invalid email or password');
  }

  const data = await res.json();
  localStorage.setItem('sl_access', data.access);
  localStorage.setItem('sl_refresh', data.refresh);
  setAuthCookie();

  return decodeToken(data.access)!;
}

export async function register(
  email: string,
  password: string,
  role: string,
  firstName = '',
  lastName = ''
): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/register/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role, first_name: firstName, last_name: lastName }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = Object.values(err).flat().join(' ') || 'Registration failed';
    throw new Error(message as string);
  }
}

export function logout() {
  localStorage.removeItem('sl_access');
  localStorage.removeItem('sl_refresh');
  clearAuthCookie();
  window.location.href = '/login';
}
