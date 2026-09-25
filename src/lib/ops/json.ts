export function safeJsonParse<T = Record<string, unknown>>(
  value: unknown,
  fallback: T | null = null
): T | null {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") return value as T;
  if (typeof value !== "string") return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
