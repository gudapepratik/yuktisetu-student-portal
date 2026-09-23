import { apiRequest } from './client';

/**
 * The student's own document locker.
 *
 * Uploads are synchronous: the bytes go up and the stored key and a directly
 * openable URL come straight back, so the student sees the document land rather
 * than being told it is "processing". Whichever resume is marked primary is the
 * one snapshotted onto every application the student makes from then on.
 */
export const documentsApi = {
  list: () => apiRequest('/api/user/documents'),

  upload: (file, docType, primary = false) => {
    const body = new FormData();
    body.append('file', file);
    const query = new URLSearchParams({ docType, primary: String(primary) });
    return apiRequest(`/api/user/documents?${query.toString()}`, { method: 'POST', body });
  },

  remove: (id) => apiRequest(`/api/user/documents/${id}`, { method: 'DELETE' }),
};

/** Mirrors StudentDocumentType on the backend; the order is the order shown. */
export const DOC_TYPES = [
  { value: 'RESUME',             label: 'Resume' },
  { value: 'COVER_LETTER',       label: 'Cover letter' },
  { value: 'MARKSHEET_10',       label: '10th marksheet' },
  { value: 'MARKSHEET_12',       label: '12th marksheet' },
  { value: 'DEGREE_CERTIFICATE', label: 'Degree certificate' },
  { value: 'AADHAAR',            label: 'Aadhaar' },
  { value: 'PAN',                label: 'PAN' },
  { value: 'CERTIFICATE',        label: 'Certificate' },
  { value: 'OTHER',              label: 'Other' },
];
