// server/middleware/admin-auth.ts
// Admin API route'larını korur
import { verifyToken, parseCookies } from "../utils/auth"

export default defineEventHandler(async (event) => {
  const path = event.path || ""

  // Sadece /api/admin/* route'larını koru (login hariç)
  if (path.startsWith("/api/admin/") && !path.includes("/api/admin/login")) {
    const cookies = parseCookies(getHeader(event, "cookie") || null)
    const token = cookies.admin_token
    if (!token) {
      throw createError({ statusCode: 401, message: "Yetkisiz erişim." })
    }
    const payload = await verifyToken(token)
    if (!payload) {
      throw createError({ statusCode: 401, message: "Oturum süresi doldu." })
    }
  }
})
