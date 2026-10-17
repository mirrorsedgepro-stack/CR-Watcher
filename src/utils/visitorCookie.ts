// Visitor Cookie & Per-Visitor Isolated Storage Manager
// Ensures every visitor's episode watch tracking, watchlist, and preferences
// are tied to their unique browser cookie (`crunchycast_visitor_id`) and cookie payload.

const VISITOR_ID_COOKIE = 'crunchycast_visitor_id';
const VISITOR_PROFILES_LIST_COOKIE = 'crunchycast_visitor_profiles';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 400; // 400 days (browser maximum)

export interface VisitorProfileMeta {
  id: string;
  label: string;
  createdAt: string;
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie ? document.cookie.split('; ') : [];
  for (const part of cookies) {
    const eqIdx = part.indexOf('=');
    if (eqIdx === -1) continue;
    const key = decodeURIComponent(part.slice(0, eqIdx).trim());
    if (key === name) {
      return decodeURIComponent(part.slice(eqIdx + 1));
    }
  }
  return null;
}

export function setCookie(
  name: string,
  value: string,
  maxAgeSeconds = COOKIE_MAX_AGE_SECONDS
): void {
  if (typeof document === 'undefined') return;
  const secureFlag =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? '; Secure'
      : '';
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
    value
  )}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secureFlag}`;
}

export function deleteCookie(name: string): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; SameSite=Lax`;
}

function generateVisitorId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `ccv_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
  }
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36);
  return `ccv_${ts}${rand}`;
}

/**
 * Retrieves the current visitor's unique ID from their browser cookie,
 * or creates and sets a new visitor cookie if none exists yet.
 */
export function getOrCreateVisitorId(): string {
  let visitorId = getCookie(VISITOR_ID_COOKIE);
  if (!visitorId || !visitorId.startsWith('ccv_')) {
    visitorId = generateVisitorId();
    setCookie(VISITOR_ID_COOKIE, visitorId);
  }
  ensureProfileInCookieList(visitorId);
  return visitorId;
}

/**
 * Switches the active `crunchycast_visitor_id` cookie to another visitor ID
 * (or creates a brand-new visitor cookie session).
 */
export function switchVisitorCookie(targetVisitorId?: string, label?: string): string {
  const nextId =
    targetVisitorId && targetVisitorId.trim().startsWith('ccv_')
      ? targetVisitorId.trim()
      : generateVisitorId();
  setCookie(VISITOR_ID_COOKIE, nextId);
  ensureProfileInCookieList(nextId, label);
  return nextId;
}

export function getKnownVisitorProfiles(): VisitorProfileMeta[] {
  try {
    const raw = getCookie(VISITOR_PROFILES_LIST_COOKIE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function ensureProfileInCookieList(visitorId: string, customLabel?: string): void {
  const existing = getKnownVisitorProfiles();
  const found = existing.find((p) => p.id === visitorId);
  if (found) {
    if (customLabel && found.label !== customLabel) {
      found.label = customLabel;
      setCookie(VISITOR_PROFILES_LIST_COOKIE, JSON.stringify(existing.slice(0, 10)));
    }
    return;
  }
  const next: VisitorProfileMeta[] = [
    ...existing,
    {
      id: visitorId,
      label: customLabel || `Visitor ${existing.length + 1}`,
      createdAt: new Date().toISOString().slice(0, 10),
    },
  ].slice(-10);
  setCookie(VISITOR_PROFILES_LIST_COOKIE, JSON.stringify(next));
}

export function renameVisitorProfile(visitorId: string, newLabel: string): VisitorProfileMeta[] {
  const existing = getKnownVisitorProfiles();
  const updated = existing.map((p) =>
    p.id === visitorId ? { ...p, label: newLabel.trim() || p.label } : p
  );
  setCookie(VISITOR_PROFILES_LIST_COOKIE, JSON.stringify(updated));
  return updated;
}

/**
 * Compactly encodes `Record<number, number[]>` (showId -> watched episode numbers)
 * into a cookie-safe string: e.g. `195516:1-3.5|189323:1.2`
 */
function encodeWatchedForCookie(watched: Record<number, number[]>): string {
  const parts: string[] = [];
  for (const [showIdStr, eps] of Object.entries(watched)) {
    if (!Array.isArray(eps) || eps.length === 0) continue;
    const sorted = Array.from(new Set(eps)).sort((a, b) => a - b);
    // Compress consecutive episode runs (e.g. [1,2,3,4] -> "1-4")
    const ranges: string[] = [];
    let start = sorted[0];
    let prev = sorted[0];
    for (let i = 1; i <= sorted.length; i++) {
      const curr = sorted[i];
      if (curr === prev + 1) {
        prev = curr;
      } else {
        ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
        start = curr;
        prev = curr;
      }
    }
    parts.push(`${showIdStr}:${ranges.join('.')}`);
  }
  return parts.join('|');
}

function decodeWatchedFromCookie(encoded: string): Record<number, number[]> {
  const result: Record<number, number[]> = {};
  if (!encoded) return result;
  const showBlocks = encoded.split('|');
  for (const block of showBlocks) {
    const [showIdStr, rangesStr] = block.split(':');
    const showId = parseInt(showIdStr, 10);
    if (Number.isNaN(showId) || !rangesStr) continue;
    const eps: number[] = [];
    for (const token of rangesStr.split('.')) {
      if (token.includes('-')) {
        const [s, e] = token.split('-').map((n) => parseInt(n, 10));
        if (!Number.isNaN(s) && !Number.isNaN(e) && e >= s && e - s <= 2000) {
          for (let ep = s; ep <= e; ep++) eps.push(ep);
        }
      } else {
        const ep = parseInt(token, 10);
        if (!Number.isNaN(ep)) eps.push(ep);
      }
    }
    if (eps.length > 0) {
      result[showId] = eps;
    }
  }
  return result;
}

function getVisitorWatchedCookieName(visitorId: string): string {
  return `cc_watched_${visitorId}`;
}

function getVisitorWatchlistCookieName(visitorId: string): string {
  return `cc_wl_${visitorId}`;
}

function getVisitorStorageKey(visitorId: string, suffix: string): string {
  return `crunchycast_visitor_${visitorId}_${suffix}`;
}

/**
 * Loads watched episodes for a specific visitor ID from their browser cookie
 * (with fallback to visitor-namespaced localStorage for very large histories).
 */
export function loadVisitorWatchedEpisodes(visitorId: string): Record<number, number[]> {
  // 1. Check visitor-specific cookie first
  const cookieVal = getCookie(getVisitorWatchedCookieName(visitorId));
  if (cookieVal !== null) {
    return decodeWatchedFromCookie(cookieVal);
  }

  // 2. Check visitor-namespaced localStorage
  try {
    const localVal = localStorage.getItem(getVisitorStorageKey(visitorId, 'watched'));
    if (localVal) {
      const parsed = JSON.parse(localVal);
      if (parsed && typeof parsed === 'object') {
        setCookie(getVisitorWatchedCookieName(visitorId), encodeWatchedForCookie(parsed));
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  return {};
}

/**
 * Saves watched episodes for a specific visitor ID directly to their visitor cookie
 * AND visitor-namespaced localStorage.
 */
export function saveVisitorWatchedEpisodes(
  visitorId: string,
  watched: Record<number, number[]>
): void {
  const encoded = encodeWatchedForCookie(watched);
  // Keep cookie under 3500 bytes so browser never drops it
  if (encoded.length <= 3500) {
    setCookie(getVisitorWatchedCookieName(visitorId), encoded);
  }
  try {
    localStorage.setItem(getVisitorStorageKey(visitorId, 'watched'), JSON.stringify(watched));
  } catch {
    // ignore
  }
}

export function loadVisitorWatchlist(visitorId: string): Set<number> {
  const cookieVal = getCookie(getVisitorWatchlistCookieName(visitorId));
  if (cookieVal !== null) {
    if (!cookieVal.trim()) return new Set();
    const ids = cookieVal
      .split(',')
      .map((s) => parseInt(s, 10))
      .filter((n) => !Number.isNaN(n) && n > 0);
    return new Set(ids);
  }

  try {
    const localVal = localStorage.getItem(getVisitorStorageKey(visitorId, 'watchlist'));
    if (localVal) {
      const parsed = JSON.parse(localVal);
      if (Array.isArray(parsed)) {
        setCookie(getVisitorWatchlistCookieName(visitorId), parsed.join(','));
        return new Set(parsed);
      }
    }
  } catch {
    // ignore
  }

  return new Set();
}

export function saveVisitorWatchlist(visitorId: string, watchlist: Set<number>): void {
  const arr = Array.from(watchlist);
  const csv = arr.join(',');
  if (csv.length <= 3500) {
    setCookie(getVisitorWatchlistCookieName(visitorId), csv);
  }
  try {
    localStorage.setItem(getVisitorStorageKey(visitorId, 'watchlist'), JSON.stringify(arr));
  } catch {
    // ignore
  }
}

export function loadVisitorCustomOffsets(visitorId: string): Record<number, number> {
  const cookieVal = getCookie(`cc_offsets_${visitorId}`);
  if (cookieVal) {
    try {
      return JSON.parse(cookieVal);
    } catch {
      // ignore
    }
  }
  try {
    const localVal = localStorage.getItem(getVisitorStorageKey(visitorId, 'offsets'));
    return localVal ? JSON.parse(localVal) : {};
  } catch {
    return {};
  }
}

export function saveVisitorCustomOffsets(
  visitorId: string,
  offsets: Record<number, number>
): void {
  const json = JSON.stringify(offsets);
  if (json.length <= 2000) {
    setCookie(`cc_offsets_${visitorId}`, json);
  }
  try {
    localStorage.setItem(getVisitorStorageKey(visitorId, 'offsets'), json);
  } catch {
    // ignore
  }
}
