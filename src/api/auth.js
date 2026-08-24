import { apiRequest } from './client';

export const authApi = {
  // Public Login (Email + Password -> Returns { accessToken, refreshToken, userId, email, roles })
  login: (credentials) =>
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  // Refresh Token
  refreshToken: (refreshToken) =>
    apiRequest('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  // Logout (Blacklist token)
  logout: (refreshToken) =>
    apiRequest('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),

  // Accept Invite / Activate Account (Public - Credential is token)
  acceptInvite: (payload) =>
    apiRequest('/api/auth/roles/accept-invite', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};