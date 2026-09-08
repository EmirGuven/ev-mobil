// POST /api/admin/login
import { getDb } from "../../utils/db"
import { signToken } from "../../utils/auth"

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body || {}

  const db = await getDb()
  const user = await db.prepare("SELECT * FROM admin_user WHERE id = 1").get() as any

  if (!user || user.username !== username || user.password_hash !== password) {
    throw createError({ statusCode: 401, message: "Kullanıcı adı veya şifre hatalı." })
  }

  const token = await signToken({ sub: "1", username: user.username })

  setCookie(event, "admin_token", token, {
    httpOnly: true,
    maxAge: 60 * 60 * 8, // 8 saat
    path: "/",
    sameSite: "lax"
  })

  return { success: true }
})
