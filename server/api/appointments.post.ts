// POST /api/appointments — randevu formu gönderimi
import { getDb } from "../utils/db"
import { checkRateLimit, resolveClientIp } from "../utils/rate-limit"

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig(event)
  const body = await readBody(event)
  const { name, phone, email, service, message } = body || {}

  const rateLimit = checkRateLimit(event, {
    keyPrefix: "contact-form",
    windowMs: 10 * 60 * 1000,
    maxRequests: 3,
  })

  if (!rateLimit.allowed) {
    setHeader(event, "Retry-After", rateLimit.retryAfterSeconds)
    throw createError({ statusCode: 429, message: "Çok sık istek gönderildi. Lütfen birkaç dakika sonra tekrar deneyin." })
  }

  const honeypot = String(body?.website || "").trim()
  if (honeypot) {
    return { success: true }
  }

  const startedAt = Number(body?.form_started_at || 0)
  if (Number.isFinite(startedAt) && startedAt > 0) {
    const elapsed = Date.now() - startedAt
    if (elapsed >= 0 && elapsed < 2500) {
      throw createError({ statusCode: 400, message: "Form çok hızlı gönderildi. Lütfen bilgileri kontrol edip tekrar deneyin." })
    }
  }

  const turnstileSecret = String(runtimeConfig.turnstileSecret || "").trim()
  if (turnstileSecret) {
    const token = String(body?.turnstile_token || "").trim()
    if (!token) {
      throw createError({ statusCode: 400, message: "Lütfen güvenlik doğrulamasını tamamlayın." })
    }

    const formData = new URLSearchParams()
    formData.set("secret", turnstileSecret)
    formData.set("response", token)
    formData.set("remoteip", resolveClientIp(event))

    let verification: any = null
    try {
      verification = await $fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        body: formData,
      })
    } catch {
      throw createError({ statusCode: 503, message: "Güvenlik doğrulama servisine ulaşılamadı. Lütfen tekrar deneyin." })
    }

    if (!verification?.success) {
      throw createError({ statusCode: 400, message: "Güvenlik doğrulaması başarısız oldu. Lütfen tekrar deneyin." })
    }
  }

  if (!name || !email) {
    throw createError({ statusCode: 400, message: "Ad ve e-posta zorunludur." })
  }

  const db = await getDb()
  const result = await db.prepare(`
    INSERT INTO appointments (name, phone, email, service, message)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    String(name).slice(0, 200),
    String(phone || "").slice(0, 50),
    String(email).slice(0, 200),
    String(service || "").slice(0, 100),
    String(message || "").slice(0, 2000)
  )

  return { success: true, id: result.lastInsertRowid }
})
