// GET /api/admin/blog — tüm yazılar (yayınlanmamışlar dahil)
// POST /api/admin/blog — yeni yazı
import { getDb } from "../../utils/db"
import { verifyToken, parseCookies } from "../../utils/auth"

async function checkAuth(event: any) {
  const cookies = parseCookies(getHeader(event, "cookie") || null)
  const payload = await verifyToken(cookies.admin_token || "")
  if (!payload) throw createError({ statusCode: 401, message: "Yetkisiz erişim." })
}

export default defineEventHandler(async (event) => {
  await checkAuth(event)
  const db = await getDb()

  if (event.method === "GET") {
    const posts = await db.prepare("SELECT * FROM blog_posts ORDER BY created_at DESC").all()
    return posts
  }

  if (event.method === "POST") {
    const body = await readBody(event)

    const baseSlug = (body.slug || body.title)
      .toLowerCase()
      .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
      .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80)

    // Slug benzersiz olana kadar suffix ekle
    let slug = baseSlug
    let attempt = 0
    while (await db.prepare("SELECT id FROM blog_posts WHERE slug = ?").get(slug)) {
      attempt++
      slug = `${baseSlug}-${attempt}`
    }

    const result = await db.prepare(`
      INSERT INTO blog_posts (slug, title, excerpt, content, category, tags, quote, read_time, date, image, hero_bg_image, featured, published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(slug, body.title, body.excerpt || "", body.content || "",
      body.category || "", body.tags || "", body.quote || "", body.read_time || "",
      body.date || new Date().toLocaleDateString("tr-TR"),
      body.image || "", body.hero_bg_image || "", body.featured ? 1 : 0, body.published !== false ? 1 : 0)

    return { success: true, id: result.lastInsertRowid, slug }
  }
})
