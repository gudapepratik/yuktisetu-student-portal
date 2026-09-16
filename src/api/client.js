/**
 * Centralized HTTP Client for YuktiSetu Student Portal
 *
 * Handles automatic JWT injection, silent token refresh on 401 (with a
 * request queue so concurrent calls don't each trigger their own refresh),
 * and unwraps the backend's YuktiSetuResponse envelope
 * ({ success, status, message, data, error, timestamp }) so callers get the
 * same plain DTOs they always did.
 */

// Endpoints that are called without a session -- a 401 here is a real
// credential/token failure, not an expired-session case to silently retry.
const PUBLIC_ENDPOINTS = [
  '/api/auth/login',
  '/api/auth/refresh',
  '/api/auth/roles/accept-invite',
];

let isRefreshing = false;
let refreshQueue = [];

function clearSession() {
  localStorage.removeItem('ys_access_token');
  localStorage.removeItem('ys_refresh_token');
}

// Called on an unrecoverable auth failure (refresh itself failed). Dispatches
// a DOM event rather than importing AuthContext directly, since this module
// has no React context of its own -- AuthContext listens for this and clears
// its user state, which naturally routes the SPA back to the Login view.
function notifySessionExpired() {
  clearSession();
  window.dispatchEvent(new CustomEvent('ys:auth-expired'));
}

async function performRefresh() {
  const refreshToken = localStorage.getItem('ys_refresh_token');
  if (!refreshToken) throw new Error('No refresh token available');

  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  const envelope = await response.json().catch(() => null);
  if (!response.ok || !envelope?.data?.accessToken) {
    throw new Error(envelope?.error?.message || envelope?.message || 'Session refresh failed');
  }

  const { accessToken, refreshToken: newRefreshToken } = envelope.data;
  localStorage.setItem('ys_access_token', accessToken);
  if (newRefreshToken) localStorage.setItem('ys_refresh_token', newRefreshToken);
  return envelope.data;
}

// Exported so AuthContext can schedule a proactive refresh a little before
// the access token actually expires, instead of always waiting for a 401.
export async function refreshAuthToken() {
  return performRefresh();
}

async function parseResponse(response, endpoint) {
  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const body = isJson ? await response.json().catch(() => null) : await response.text();

  // Every backend response is now { success, status, message, data, error, timestamp }.
  const envelope = body && typeof body === 'object' && 'success' in body ? body : null;

  if (!response.ok) {
    const message =
      envelope?.error?.message ||
      envelope?.message ||
      (body && typeof body === 'object' && (body.message || body.error)) ||
      `Request failed with status ${response.status}`;

    const error = new Error(message);
    error.status = response.status;
    error.code = envelope?.error?.code;
    error.payload = body;

    if (response.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/accept-invite')) {
      console.warn('Session expired or unauthorized request:', endpoint);
    }
    throw error;
  }

  return envelope ? envelope.data : body;
}

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('ys_access_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(endpoint, { ...options, headers });

  const isAuthenticatedCall = !PUBLIC_ENDPOINTS.includes(endpoint);
  if (response.status === 401 && isAuthenticatedCall && !options._retry) {
    if (isRefreshing) {
      // Another call already triggered a refresh -- wait for it instead of
      // firing a second one, then retry this request once.
      await new Promise((resolve, reject) => refreshQueue.push({ resolve, reject }));
      return apiRequest(endpoint, { ...options, _retry: true });
    }

    isRefreshing = true;
    try {
      await performRefresh();
      refreshQueue.forEach((p) => p.resolve());
      refreshQueue = [];
      return apiRequest(endpoint, { ...options, _retry: true });
    } catch (refreshError) {
      refreshQueue.forEach((p) => p.reject(refreshError));
      refreshQueue = [];
      notifySessionExpired();
      throw refreshError;
    } finally {
      isRefreshing = false;
    }
  }

  return parseResponse(response, endpoint);
}
