/**
 * Centralized HTTP Client for YuktiSetu Student Portal
 * Handles automatic JWT injection, error normalization, and standard HTTP verbs.
 */

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('ys_access_token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(endpoint, config);

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage =
        (typeof data === 'object' && (data.message || data.error || data.code)) ||
        `Request failed with status ${response.status}`;
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.code = data?.code;
      error.payload = data;
      throw error;
    }

    return data;
  } catch (err) {
    // If unauthorized and not on login page, can notify context
    if (err.status === 401 && !endpoint.includes('/login') && !endpoint.includes('/accept-invite')) {
      console.warn('Session expired or unauthorized request:', endpoint);
    }
    throw err;
  }
}