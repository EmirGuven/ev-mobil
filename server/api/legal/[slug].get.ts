// GET /api/legal/[slug] — public, yasal sayfa içeriğini döner
import { getDb } from "../../utils/db"

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const db = await getDb()
  const page = await db.prepare("SELECT * FROM legal_pages WHERE slug = ?").get(slug) as any
  if (!page) throw createError({ statusCode: 404, message: "Sayfa bulunamadı." })
  return { slug: page.slug, title: page.title, content: page.content, updatedAt: page.updated_at }
})
