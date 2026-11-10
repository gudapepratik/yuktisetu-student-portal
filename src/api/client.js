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

/**
 * fetch, retried while a service restarts (2026-11-01).
 *
 * A 503 SERVICE_RECOVERING means the server is still picking up work from before
 * the restart and did not touch this request, so any method is safe to send
 * again. A 502/504 or a dropped connection may or may not have reached it, so
 * only reads are retried there -- re-sending a mark or a publish blind could do
 * it twice. Waits 1, 2, 4, 4, 4 s: about 15 s in all, then the error surfaces.
 */
const RETRY_DELAYS_MS = [1000, 2000, 4000, 4000, 4000];

async function fetchWithRestartRetry(endpoint, config) {
  const method = (config.method || 'GET').toUpperCase();
  const idempotent = method === 'GET' || method === 'HEAD';
  for (let attempt = 0; ; attempt += 1) {
    let response;
    try {
      response = await fetch(endpoint, config);
    } catch (networkError) {
      if (!idempotent || attempt >= RETRY_DELAYS_MS.length) throw networkError;
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
      continue;
    }
    const recovering = response.status === 503;
    const gateway = response.status === 502 || response.status === 504;
    if ((recovering || (gateway && idempotent)) && attempt < RETRY_DELAYS_MS.length) {
      const after = Number(response.headers.get('Retry-After'));
      await new Promise((r) => setTimeout(r, after > 0 ? after * 1000 : RETRY_DELAYS_MS[attempt]));
      continue;
    }
    return response;
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('ys_access_token');

  // A FormData body must NOT carry an explicit Content-Type -- the browser sets
  // it so it can append the multipart boundary, and forcing application/json
  // here makes the server reject the upload as malformed. Uploads still run
  // through this function so they inherit the 401 refresh-and-retry below.
  const isMultipart = options.body instanceof FormData;

  const headers = {
    ...(isMultipart ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetchWithRestartRetry(endpoint, { ...options, headers });

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
