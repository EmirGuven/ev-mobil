// GET+PUT /api/admin/legal — yasal sayfa yönetimi
import { getDb } from "../../utils/db"
import { verifyToken, parseCookies } from "../../utils/auth"

async function checkAuth(event: any) {
  const cookies = parseCookies(getHeader(event, "cookie") || null)
  const token = cookies.admin_token
  if (!token) throw createError({ statusCode: 401, message: "Yetkisiz erişim." })
  const payload = await verifyToken(token)
  if (!payload) throw createError({ statusCode: 401, message: "Oturum süresi doldu." })
}

export default defineEventHandler(async (event) => {
  await checkAuth(event)
  const db = await getDb()

  if (event.method === "GET") {
    return await db.prepare("SELECT slug, title, content, updated_at FROM legal_pages ORDER BY id").all()
  }

  if (event.method === "PUT") {
    const body = await readBody(event) as Array<{ slug: string; title: string; content: string }>
    const upsert = db.prepare(`
      INSERT INTO legal_pages (slug, title, content, updated_at)
      VALUES (?, ?, ?, now()::text)
      ON CONFLICT(slug) DO UPDATE SET title = excluded.title, content = excluded.content, updated_at = excluded.updated_at
    `)
    const tx = db.transaction(async () => {
      for (const p of body) {
        await upsert.run(p.slug, p.title || '', p.content || '')
      }
    })
    await tx()
    return { success: true }
  }
})
