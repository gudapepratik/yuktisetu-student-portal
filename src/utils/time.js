/**
 * Dates and times, always Indian Standard Time.
 *
 * Every formatter pins timeZone to Asia/Kolkata instead of "whatever this browser is
 * set to", so a drive deadline reads the same on a laptop in Pune and one set to
 * another zone. The API already sends times as +05:30, and the datetime-local inputs
 * are read as IST on the way back.
 */
export const IST = 'Asia/Kolkata';

const DATE_TIME = { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: IST };
const DATE_ONLY = { day: 'numeric', month: 'short', year: 'numeric', timeZone: IST };

/** "20 Oct 2026, 05:30 pm" */
export function formatDateTime(iso) {
  return iso ? new Date(iso).toLocaleString('en-IN', DATE_TIME) : '—';
}

/** "20 Oct 2026" */
export function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString('en-IN', DATE_ONLY) : '—';
}

/**
 * A <input type="datetime-local"> value ("2026-10-20T17:30", no zone) -> what the API
 * gets. Read as IST regardless of the browser's zone, and sent with its +05:30 so
 * nothing downstream has to guess.
 */
export function istInputToApi(localValue) {
  return localValue ? `${localValue.length === 16 ? `${localValue}:00` : localValue}+05:30` : null;
}

/** Today's date in India as "YYYY-MM-DD", for date inputs' max/min. */
export function todayIst() {
  return new Date().toLocaleDateString('en-CA', { timeZone: IST });
}
