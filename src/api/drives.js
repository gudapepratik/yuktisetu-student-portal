import { apiRequest } from './client';

/**
 * Student-facing drive endpoints, served by drive-service on /api/drive.
 *
 * These paths replace an earlier speculative set (/api/drives/...) that was
 * written before the backend existed and never matched it.
 *
 * Every call acts on the authenticated student and takes no student id — there is
 * no parameter through which one student could ask about another's applications.
 *
 * A drive the student is not eligible for is not hidden, it is absent: the list
 * only ever contains drives they may see, and asking for another one directly
 * returns 404 rather than 403, so the id space cannot be walked.
 */
export const drivesApi = {
  /** tab: 'open' (default) | 'closed' | 'all' */
  listDrives: (tab = 'open') =>
    apiRequest(`/api/drive/postings?tab=${encodeURIComponent(tab)}`),

  getDrive: (postingId) => apiRequest(`/api/drive/postings/${postingId}`),

  /**
   * "Why can't I apply?" — runs the same live check the apply endpoint runs, so
   * the reason shown is the one that would actually block them.
   */
  myEligibility: (postingId) => apiRequest(`/api/drive/postings/${postingId}/my-eligibility`),

  /** Easy Apply. No payload: the student's placement data already exists. */
  applyToDrive: (postingId) =>
    apiRequest(`/api/drive/postings/${postingId}/apply`, { method: 'POST' }),

  /** Only while the window is open — after the deadline the pool is sealed. */
  withdrawApplication: (postingId) =>
    apiRequest(`/api/drive/postings/${postingId}/apply`, { method: 'DELETE' }),

  getMyApplications: () => apiRequest('/api/drive/applications'),
};
