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
};