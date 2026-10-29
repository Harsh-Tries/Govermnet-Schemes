const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface UserSession {
  id: string;
  email: string | null;
  role: string;
  full_name?: string | null;
  is_onboarding_completed: boolean;
  onboarding_step?: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in_minutes: number;
  user: UserSession;
}

export const authStorage = {
  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('scheme_auth_token');
  },
  setToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('scheme_auth_token', token);
  },
  getUser(): UserSession | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('scheme_auth_user');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
  setUser(user: UserSession): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('scheme_auth_user', JSON.stringify(user));
  },
  clear(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('scheme_auth_token');
    localStorage.removeItem('scheme_auth_user');
  },
  isAuthenticated(): boolean {
    return Boolean(authStorage.getToken());
  }
};

export async function loginCitizen(credentials: { email: string; password?: string }): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(errorData.detail || `Login error (${res.status})`);
  }

  const data: AuthResponse = await res.json();
  authStorage.setToken(data.access_token);
  authStorage.setUser(data.user);
  return data;
}

export async function registerCitizen(data: {
  email: string;
  password: string;
  full_name?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Registration failed' }));
    throw new Error(errorData.detail || `Registration error (${res.status})`);
  }

  const authData: AuthResponse = await res.json();
  authStorage.setToken(authData.access_token);
  authStorage.setUser(authData.user);
  return authData;
}

export async function getCurrentUser(): Promise<UserSession | null> {
  const token = authStorage.getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/auth/me`, { headers });
    if (!res.ok) {
      if (res.status === 401) {
        authStorage.clear();
      }
      return null;
    }
    const user: UserSession = await res.json();
    authStorage.setUser(user);
    return user;
  } catch (err) {
    console.warn('Failed to fetch authenticated user:', err);
    return authStorage.getUser();
  }
}

export function logoutCitizen(): void {
  authStorage.clear();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
