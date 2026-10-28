/**
 * URL <-> screen mapping for the student portal.
 *
 * There is no router: the current screen is React state, which a refresh throws
 * away -- so every reload landed on the dashboard. The address bar is now the
 * source of truth on load and is kept in step as the screen changes, so a
 * refresh, a hard refresh, a bookmark or a pasted link all return to the same place.
 *
 *   /                 dashboard
 *   /profile  /documents  /settings
 *   /drives           the drive list   (?tab=open|applied|... remembers the tab)
 *   /drives/42        drive 42's detail, open over the list
 *
 * The server must answer these paths with index.html (the Vite dev server does;
 * a production static host needs an SPA fallback rule).
 */

const VIEW_PATHS = {
  dashboard: '/',
  profile: '/profile',
  documents: '/documents',
  drives: '/drives',
  settings: '/settings',
};

const clean = (pathname) => (pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname);

export function viewFromPath(pathname) {
  const path = clean(pathname || '/');
  if (path.startsWith('/drives')) return 'drives';
  const found = Object.entries(VIEW_PATHS).find(([, p]) => p === path);
  return found ? found[0] : null;
}

export function pathForView(view) {
  return VIEW_PATHS[view] ?? null;
}

/** /drives/42 -> 42, anything else -> null. */
export function parseDriveId(pathname) {
  const m = clean(pathname || '').match(/^\/drives\/(\d+)$/);
  return m ? Number(m[1]) : null;
}

/** Change the address bar (path and optional query) without reloading. */
export function navigateTo(pathAndQuery, { replace = false } = {}) {
  const current = window.location.pathname + window.location.search;
  if (current === pathAndQuery) return;
  window.history[replace ? 'replaceState' : 'pushState'](null, '', pathAndQuery);
}
