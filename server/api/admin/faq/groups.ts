// POST /api/admin/faq/groups — yeni kategori ekle
import { getDb } from "../../../utils/db"
import { verifyToken, parseCookies } from "../../../utils/auth"

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

  if (event.method === "POST") {
    const { category, sort_order } = await readBody(event)
    if (!category?.trim()) throw createError({ statusCode: 400, message: "Kategori adı zorunlu." })

    const maxOrder = (await db.prepare("SELECT MAX(sort_order) as m FROM faq_groups").get() as any)?.m ?? 0
    const result = await db.prepare(
      "INSERT INTO faq_groups (category, sort_order) VALUES (?, ?)"
    ).run(category.trim(), sort_order ?? maxOrder + 1)

    return { id: result.lastInsertRowid, category: category.trim(), sort_order: sort_order ?? maxOrder + 1, items: [] }
  }

  throw createError({ statusCode: 405, message: "Method not allowed." })
})
