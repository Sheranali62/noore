const buckets = new Map<string, { count: number; resetAt: number }>()

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")
  const candidate = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown"
  return candidate.slice(0, 100)
}

export function checkRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()
  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    if (buckets.size > 10000) {
      for (const [entryKey, value] of buckets) {
        if (value.resetAt <= now) buckets.delete(entryKey)
      }
    }
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: Math.ceil(windowMs / 1000) }
  }

  current.count += 1
  const remaining = Math.max(0, limit - current.count)
  return {
    allowed: current.count <= limit,
    remaining,
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  }
}
