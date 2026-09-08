// PUT /api/admin/faq/groups/[id] — kategori adını güncelle
// DELETE /api/admin/faq/groups/[id] — kategori ve tüm sorularını sil
import { getDb } from "../../../../utils/db"
import { verifyToken, parseCookies } from "../../../../utils/auth"

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
  const id = Number(getRouterParam(event, "id"))
  if (!id) throw createError({ statusCode: 400, message: "Geçersiz ID." })

  if (event.method === "PUT") {
    const { category, sort_order } = await readBody(event)
    if (!category?.trim()) throw createError({ statusCode: 400, message: "Kategori adı zorunlu." })

    await db.prepare("UPDATE faq_groups SET category = ?, sort_order = COALESCE(?, sort_order) WHERE id = ?")
      .run(category.trim(), sort_order ?? null, id)

    return { success: true }
  }

  if (event.method === "DELETE") {
    await db.prepare("DELETE FROM faq_items WHERE group_id = ?").run(id)
    await db.prepare("DELETE FROM faq_groups WHERE id = ?").run(id)
    return { success: true }
  }

  throw createError({ statusCode: 405, message: "Method not allowed." })
})
