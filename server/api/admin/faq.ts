// GET+PUT /api/admin/faq — SSS yönetimi
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
    const groups = await db.prepare("SELECT * FROM faq_groups ORDER BY sort_order, id").all() as any[]
    const items  = await db.prepare("SELECT * FROM faq_items ORDER BY group_id, sort_order, id").all() as any[]
    return groups.map((g) => ({
      id: g.id,
      category: g.category,
      sort_order: g.sort_order,
      items: items
        .filter((i) => i.group_id === g.id)
        .map((i) => ({ id: i.id, question: i.question, answer: i.answer, sort_order: i.sort_order }))
    }))
  }

  // PUT — tüm yapıyı sıfırdan yazar
  if (event.method === "PUT") {
    const body = await readBody(event) as Array<{
      id?: number
      category: string
      sort_order?: number
      items: Array<{ id?: number; question: string; answer: string; sort_order?: number }>
    }>

    const deleteItems  = db.prepare("DELETE FROM faq_items")
    const deleteGroups = db.prepare("DELETE FROM faq_groups")
    const insertGroup  = db.prepare("INSERT INTO faq_groups (id, category, sort_order) VALUES (?, ?, ?)")
    const insertItem   = db.prepare("INSERT INTO faq_items (group_id, question, answer, sort_order) VALUES (?, ?, ?, ?)")

    const tx = db.transaction(async () => {
      await deleteItems.run()
      await deleteGroups.run()
      for (const [gi, g] of body.entries()) {
        const groupId = g.id ?? (gi + 1)
        await insertGroup.run(groupId, g.category || '', g.sort_order ?? gi)
        const items = g.items || []
        for (const [ii, item] of items.entries()) {
          await insertItem.run(groupId, item.question || '', item.answer || '', item.sort_order ?? ii)
        }
      }
    })
    await tx()
    return { success: true }
  }
})
