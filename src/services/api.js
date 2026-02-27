/* ═══════════════════════════════════════════
   Sarathi – API Service
   Base URL & authenticated fetch wrapper
   ═══════════════════════════════════════════ */

import { BASE_URL } from '../config';

/**
 * Authenticated fetch wrapper.
 * Automatically attaches the Bearer token and
 * handles 401 responses by triggering logout.
 */
export async function apiFetch(endpoint, options = {}) {
  const { getToken, logout } = await import('./authService');

  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // auto-logout on 401 (expired / invalid token)
  if (res.status === 401) {
    await logout();
    window.location.href = '/';
    throw new Error('Session expired');
  }

  return res;
}

/**
 * POST to /auth/login – no token needed
 */
export async function loginAPI(email, password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Login failed');
  }

  return res.json();
}
