// Staff secret resolution: URL ?key= wins (and is remembered), otherwise localStorage.
const STORAGE_KEY = 'staff_key';

export function getStaffKey(urlKey: string | null): string {
  if (typeof window === 'undefined') return urlKey ?? '';
  if (urlKey) {
    try { localStorage.setItem(STORAGE_KEY, urlKey); } catch {}
    return urlKey;
  }
  try { return localStorage.getItem(STORAGE_KEY) ?? ''; } catch { return ''; }
}

export function saveStaffKey(key: string) {
  try { localStorage.setItem(STORAGE_KEY, key); } catch {}
}

export function clearStaffKey() {
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
}
