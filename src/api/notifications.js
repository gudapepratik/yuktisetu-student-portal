import { apiRequest } from './client';

/**
 * The bell, served by notification-service on /api/notification.
 *
 * Every call acts on whoever holds the token. There is no userId parameter
 * anywhere in this file, and that is deliberate on the backend too -- an inbox
 * endpoint that accepted a user id would let any signed-in account page through
 * someone else's notifications, which on this platform means their shortlist and
 * offer history.
 *
 * unreadCount is a separate endpoint from list on purpose: the bell polls the
 * count every minute and must not drag a page of notification bodies with it.
 */
export const notificationsApi = {
  list: ({ unreadOnly = false, page = 0, size = 20 } = {}) =>
    apiRequest(
      `/api/notification/notifications?unreadOnly=${unreadOnly}&page=${page}&size=${size}`
    ),

  unreadCount: () => apiRequest('/api/notification/notifications/unread-count'),

  markRead: (id) =>
    apiRequest(`/api/notification/notifications/${id}/read`, { method: 'POST' }),

  markAllRead: () =>
    apiRequest('/api/notification/notifications/read-all', { method: 'POST' }),
};
