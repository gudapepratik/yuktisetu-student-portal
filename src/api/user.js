import { apiRequest } from './client';

export const userApi = {
  // Get complete student profile
  getStudentProfile: () =>
    apiRequest('/api/user/student-profile', {
      method: 'GET',
    }),

  // Partially update student profile
  updateStudentProfile: (data) =>
    apiRequest('/api/user/student-profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  // Get basic user profile by userId
  getUserProfile: (userId) =>
    apiRequest(`/api/user/user-profile/${userId}`, {
      method: 'GET',
    }),
};