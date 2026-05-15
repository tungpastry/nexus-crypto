function getStorage() {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function safeRemoveKey(key: string) {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(key);
  } catch (error) {
    console.error(`Failed to remove localStorage key ${key}:`, error);
  }
}

export function safeReadJson<T>(
  key: string,
  fallback: T,
  validator?: (value: unknown) => value is T
): T {
  const storage = getStorage();
  if (!storage) return fallback;

  try {
    const saved = storage.getItem(key);
    if (!saved) return fallback;

    const parsed: unknown = JSON.parse(saved);
    if (validator && !validator(parsed)) {
      safeRemoveKey(key);
      return fallback;
    }

    return parsed as T;
  } catch (error) {
    console.error(`Failed to parse localStorage key ${key}:`, error);
    safeRemoveKey(key);
    return fallback;
  }
}

export function safeWriteJson(key: string, value: unknown) {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to write localStorage key ${key}:`, error);
  }
}
