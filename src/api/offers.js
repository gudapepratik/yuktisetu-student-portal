import { apiRequest } from './client';

/** The student's offers: accept, decline (with a reason), ask to withdraw (with a reason). */
export const offersApi = {
  list: () => apiRequest('/api/drive/offers'),
  accept: (offerId) => apiRequest(`/api/drive/offers/${offerId}/accept`, { method: 'POST' }),
  decline: (offerId, reason) =>
    apiRequest(`/api/drive/offers/${offerId}/decline`, { method: 'POST', body: JSON.stringify({ reason }) }),
  requestWithdrawal: (offerId, reason) =>
    apiRequest(`/api/drive/offers/${offerId}/withdrawal-request`, { method: 'POST', body: JSON.stringify({ reason }) }),
};
