type RateLimitOptions = {
  keyPrefix?: string
  windowMs: number
  maxRequests: number
}

type RateLimitResult = {
  allowed: boolean
  retryAfterSeconds: number
}

type Bucket = {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

function cleanupExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export function resolveClientIp(event: any) {
  const forwarded = String(getHeader(event, "x-forwarded-for") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)[0]

  const realIp = String(getHeader(event, "x-real-ip") || "").trim()
  const fallbackIp = String(event?.node?.req?.socket?.remoteAddress || "unknown").trim()

  return forwarded || realIp || fallbackIp || "unknown"
}

export function checkRateLimit(event: any, options: RateLimitOptions): RateLimitResult {
  const now = Date.now()
  cleanupExpired(now)

  const ip = resolveClientIp(event)
  const keyPrefix = options.keyPrefix || "default"
  const key = `${keyPrefix}:${ip}`
  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + options.windowMs,
    })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  if (existing.count >= options.maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    return { allowed: false, retryAfterSeconds }
  }

  existing.count += 1
  buckets.set(key, existing)
  return { allowed: true, retryAfterSeconds: 0 }
}