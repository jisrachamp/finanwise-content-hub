export function setItem(key: string, value: string) {
  localStorage.setItem(key, value);
}

export function getItem(key: string) {
  return localStorage.getItem(key);
}

export function removeItem(key: string) {
  localStorage.removeItem(key);
}

export function setJSON<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getJSON<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
