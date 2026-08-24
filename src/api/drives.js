import { apiRequest } from './client';

export const drivesApi = {
  // List all active placement drives
  listDrives: (params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.type) query.append('type', params.type);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiRequest(`/api/drives${queryString}`);
  },

  // Get single drive details
  getDrive: (id) => apiRequest(`/api/drives/${id}`),

  // Apply to a drive
  applyToDrive: (driveId, payload) =>
    apiRequest(`/api/drives/${driveId}/apply`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Get student's applications
  getMyApplications: () => apiRequest('/api/drives/my-applications'),

  // Withdraw application
  withdrawApplication: (applicationId) =>
    apiRequest(`/api/drives/applications/${applicationId}/withdraw`, {
      method: 'POST',
    }),
};