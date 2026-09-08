// GET + PUT /api/admin/blog-page
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
    const row = await db.prepare("SELECT * FROM blog_page WHERE id = 1").get() as any
    if (!row) return {}
    return {
      heroEyebrow: row.hero_eyebrow || '',
      heroTitle:   row.hero_title   || '',
      heroLead:    row.hero_lead    || '',
      heroBgImage: row.hero_bg_image|| '',
    }
  }

  if (event.method === "PUT") {
    const body = await readBody(event)
    const heroEyebrow = body.heroEyebrow ?? body.hero_eyebrow ?? ''
    const heroTitle   = body.heroTitle   ?? body.hero_title   ?? ''
    const heroLead    = body.heroLead    ?? body.hero_lead    ?? ''
    const heroBgImage = body.heroBgImage ?? body.hero_bg_image?? ''
    await db.prepare(`UPDATE blog_page SET hero_eyebrow=?, hero_title=?, hero_lead=?, hero_bg_image=? WHERE id=1`)
      .run(heroEyebrow, heroTitle, heroLead, heroBgImage)
    return { success: true }
  }
})
