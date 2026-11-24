// Giới hạn tần suất đơn giản trong bộ nhớ (đủ cho 1 server). Nhiều server → dùng Redis.
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) return false;
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 10_000) hits.clear();
  return true;
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}
