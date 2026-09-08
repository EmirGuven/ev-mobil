// PUT /api/admin/faq/items/[id] — soru/cevap güncelle
// DELETE /api/admin/faq/items/[id] — soru sil
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
    const { question, answer, sort_order } = await readBody(event)
    if (!question?.trim()) throw createError({ statusCode: 400, message: "Soru metni zorunlu." })
    if (!answer?.trim()) throw createError({ statusCode: 400, message: "Cevap metni zorunlu." })

    await db.prepare(
      "UPDATE faq_items SET question = ?, answer = ?, sort_order = COALESCE(?, sort_order) WHERE id = ?"
    ).run(question.trim(), answer.trim(), sort_order ?? null, id)

    return { success: true }
  }

  if (event.method === "DELETE") {
    await db.prepare("DELETE FROM faq_items WHERE id = ?").run(id)
    return { success: true }
  }

  throw createError({ statusCode: 405, message: "Method not allowed." })
})
