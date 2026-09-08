// PostgreSQL seeder — eski SQLite (data-db/app.db) içeriğinden alınan gerçek site
// verisini (marka, hizmetler, blog, SSS, yasal metinler, admin kullanıcısı) PostgreSQL
// veritabanına yazar.
//
// Kullanım:
//   DATABASE_URL=postgresql://user:pass@host:5432/dbname npx jiti scripts/seed-postgres.ts
//
// Tekrar çalıştırmak güvenlidir: tek satırlık tablolar UPDATE edilir, çok satırlı
// tablolar (blog, SSS, yasal sayfalar, hizmet sayfaları) temizlenip yeniden yazılır.

import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"
import { getDb } from "../server/utils/db"

const __dirname = dirname(fileURLToPath(import.meta.url))
const seedData = JSON.parse(readFileSync(join(__dirname, "seed-data.json"), "utf-8"))

async function main() {
  const db = await getDb()
  const run = db.transaction(async () => {
    // ── site_settings ──────────────────────────────────────────────
    const s = seedData.site_settings
    await db.prepare(`
      UPDATE site_settings SET
        name=?, title_suffix=?, description=?, logo_tagline=?, footer_tagline=?,
        phone=?, phone_display=?, email=?, address_street=?, address_region=?, address_city=?,
        working_hours=?, maps_url=?, social_instagram=?, social_linkedin=?,
        theme_palette=?, custom_theme_enabled=?, custom_primary=?, custom_primary_deep=?,
        custom_surface_dark=?, custom_accent_contrast=?, hero_image=?, og_image=?, favicon=?,
        logo_type=?, logo_image=?, header_cta_label=?, header_cta_url=?, header_menu_items=?,
        footer_services_title=?, footer_menu_title=?, footer_menu_items=?, footer_contact_title=?,
        footer_bottom_text=?, footer_legal_links=?
      WHERE id = 1
    `).run(
      s.name, s.title_suffix, s.description, s.logo_tagline, s.footer_tagline,
      s.phone, s.phone_display, s.email, s.address_street, s.address_region, s.address_city,
      s.working_hours, s.maps_url, s.social_instagram, s.social_linkedin,
      s.theme_palette, s.custom_theme_enabled, s.custom_primary, s.custom_primary_deep,
      s.custom_surface_dark, s.custom_accent_contrast, s.hero_image, s.og_image, s.favicon,
      s.logo_type, s.logo_image, s.header_cta_label, s.header_cta_url, s.header_menu_items,
      s.footer_services_title, s.footer_menu_title, s.footer_menu_items, s.footer_contact_title,
      s.footer_bottom_text, s.footer_legal_links,
    )
    console.log("✓ site_settings")

    // ── about_page ──────────────────────────────────────────────────
    const a = seedData.about_page
    await db.prepare(`
      UPDATE about_page SET
        hero_eyebrow=?, hero_title=?, hero_lead=?, hero_bg_image=?, photo_url=?,
        bio_title=?, bio_paragraphs=?, specialties=?, timeline=?,
        approach_title=?, approach_lead=?, approach_values=?,
        cta_title=?, cta_text=?, cta_bg_image=?, cta_primary_label=?, cta_primary_url=?,
        cta_secondary_label=?, cta_secondary_url=?
      WHERE id = 1
    `).run(
      a.hero_eyebrow, a.hero_title, a.hero_lead, a.hero_bg_image, a.photo_url,
      a.bio_title, a.bio_paragraphs, a.specialties, a.timeline,
      a.approach_title, a.approach_lead, a.approach_values,
      a.cta_title, a.cta_text, a.cta_bg_image, a.cta_primary_label, a.cta_primary_url,
      a.cta_secondary_label, a.cta_secondary_url,
    )
    console.log("✓ about_page")

    // ── homepage ────────────────────────────────────────────────────
    const h = seedData.homepage
    await db.prepare(`
      UPDATE homepage SET
        hero_eyebrow=?, hero_title=?, hero_description=?, hero_badge1=?, hero_badge2=?, hero_badge3=?,
        hero_bg_image=?, hero_images=?, hero_primary_label=?, hero_primary_url=?,
        hero_secondary_label=?, hero_secondary_url=?, accreditations=?,
        about_eyebrow=?, about_title=?, about_role=?, about_paragraph1=?, about_paragraph2=?, about_photo=?,
        services_eyebrow=?, services_title=?, services_description=?, services_bg_image=?,
        process_eyebrow=?, process_title=?, process_description=?, process_steps=?,
        testimonials_eyebrow=?, testimonials_title=?, testimonials_description=?,
        cta_title=?, cta_description=?, cta_bg_image=?, cta_primary_label=?, cta_primary_url=?,
        cta_secondary_label=?, cta_secondary_url=?, services_items=?
      WHERE id = 1
    `).run(
      h.hero_eyebrow, h.hero_title, h.hero_description, h.hero_badge1, h.hero_badge2, h.hero_badge3,
      h.hero_bg_image, h.hero_images, h.hero_primary_label, h.hero_primary_url,
      h.hero_secondary_label, h.hero_secondary_url, h.accreditations,
      h.about_eyebrow, h.about_title, h.about_role, h.about_paragraph1, h.about_paragraph2, h.about_photo,
      h.services_eyebrow, h.services_title, h.services_description, h.services_bg_image,
      h.process_eyebrow, h.process_title, h.process_description, h.process_steps,
      h.testimonials_eyebrow, h.testimonials_title, h.testimonials_description,
      h.cta_title, h.cta_description, h.cta_bg_image, h.cta_primary_label, h.cta_primary_url,
      h.cta_secondary_label, h.cta_secondary_url, h.services_items,
    )
    console.log("✓ homepage")

    // ── contact_page / blog_page / sss_page / services_page ──────────
    const c = seedData.contact_page
    await db.prepare(`
      UPDATE contact_page SET
        hero_eyebrow=?, hero_title=?, hero_lead=?, hero_bg_image=?, info_title=?, info_lead=?,
        contact_email=?, form_title=?, form_lead=?, cta_title=?, cta_lead=?, cta_bg_image=?,
        cta_primary_label=?, cta_primary_url=?, cta_secondary_label=?, cta_secondary_url=?
      WHERE id = 1
    `).run(
      c.hero_eyebrow, c.hero_title, c.hero_lead, c.hero_bg_image, c.info_title, c.info_lead,
      c.contact_email, c.form_title, c.form_lead, c.cta_title, c.cta_lead, c.cta_bg_image,
      c.cta_primary_label, c.cta_primary_url, c.cta_secondary_label, c.cta_secondary_url,
    )
    console.log("✓ contact_page")

    const bp = seedData.blog_page
    await db.prepare(`
      UPDATE blog_page SET hero_eyebrow=?, hero_title=?, hero_lead=?, hero_bg_image=? WHERE id = 1
    `).run(bp.hero_eyebrow, bp.hero_title, bp.hero_lead, bp.hero_bg_image)
    console.log("✓ blog_page")

    const sp = seedData.sss_page
    await db.prepare(`
      UPDATE sss_page SET
        hero_eyebrow=?, hero_title=?, hero_lead=?, hero_bg_image=?, cta_title=?, cta_lead=?,
        cta_bg_image=?, cta_primary_label=?, cta_primary_url=?, cta_secondary_label=?, cta_secondary_url=?
      WHERE id = 1
    `).run(
      sp.hero_eyebrow, sp.hero_title, sp.hero_lead, sp.hero_bg_image, sp.cta_title, sp.cta_lead,
      sp.cta_bg_image, sp.cta_primary_label, sp.cta_primary_url, sp.cta_secondary_label, sp.cta_secondary_url,
    )
    console.log("✓ sss_page")

    const svp = seedData.services_page
    await db.prepare(`
      UPDATE services_page SET
        hero_eyebrow=?, hero_title=?, hero_lead=?, hero_bg_image=?, intro_title=?, intro_lead=?,
        cta_title=?, cta_lead=?, cta_bg_image=?, cta_primary_label=?, cta_primary_url=?,
        cta_secondary_label=?, cta_secondary_url=?
      WHERE id = 1
    `).run(
      svp.hero_eyebrow, svp.hero_title, svp.hero_lead, svp.hero_bg_image, svp.intro_title, svp.intro_lead,
      svp.cta_title, svp.cta_lead, svp.cta_bg_image, svp.cta_primary_label, svp.cta_primary_url,
      svp.cta_secondary_label, svp.cta_secondary_url,
    )
    console.log("✓ services_page")

    // ── admin_user ──────────────────────────────────────────────────
    const u = seedData.admin_user
    if (u) {
      await db.prepare(`UPDATE admin_user SET username=?, password_hash=? WHERE id = 1`).run(
        u.username, u.password_hash,
      )
      console.log("✓ admin_user")
    }

    // ── blog_posts (temizle + yeniden yaz) ────────────────────────────
    await db.exec("DELETE FROM blog_posts")
    for (const p of seedData.blog_posts) {
      await db.prepare(`
        INSERT INTO blog_posts (slug, title, excerpt, content, category, tags, quote, read_time, date, image, hero_bg_image, featured, published)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        p.slug, p.title, p.excerpt, p.content, p.category, p.tags, p.quote,
        p.read_time, p.date, p.image, p.hero_bg_image, p.featured, p.published,
      )
    }
    console.log(`✓ blog_posts (${seedData.blog_posts.length})`)

    // ── legal_pages (temizle + yeniden yaz) ───────────────────────────
    await db.exec("DELETE FROM legal_pages")
    for (const l of seedData.legal_pages) {
      await db.prepare(`INSERT INTO legal_pages (slug, title, content) VALUES (?, ?, ?)`).run(
        l.slug, l.title, l.content,
      )
    }
    console.log(`✓ legal_pages (${seedData.legal_pages.length})`)

    // ── service_pages (temizle + yeniden yaz) ─────────────────────────
    await db.exec("DELETE FROM service_pages")
    for (const sv of seedData.service_pages) {
      await db.prepare(`
        INSERT INTO service_pages (
          slug, hero_eyebrow, hero_title, hero_lead, hero_bg_image, what_title, what_lead, benefits,
          issues_title, issues_lead, issues, process_title, process_lead, process_steps,
          cta_title, cta_lead, cta_bg_image, cta_primary_label, cta_primary_url,
          cta_secondary_label, cta_secondary_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        sv.slug, sv.hero_eyebrow, sv.hero_title, sv.hero_lead, sv.hero_bg_image, sv.what_title, sv.what_lead, sv.benefits,
        sv.issues_title, sv.issues_lead, sv.issues, sv.process_title, sv.process_lead, sv.process_steps,
        sv.cta_title, sv.cta_lead, sv.cta_bg_image, sv.cta_primary_label, sv.cta_primary_url,
        sv.cta_secondary_label, sv.cta_secondary_url,
      )
    }
    console.log(`✓ service_pages (${seedData.service_pages.length})`)

    // ── faq_groups + faq_items (temizle + yeniden yaz) ─────────────────
    await db.exec("DELETE FROM faq_items")
    await db.exec("DELETE FROM faq_groups")
    let totalItems = 0
    for (const g of seedData.faq_groups) {
      const { lastInsertRowid: groupId } = await db.prepare(
        `INSERT INTO faq_groups (category, sort_order) VALUES (?, ?)`
      ).run(g.category, g.sort_order)
      for (const it of g.items) {
        await db.prepare(
          `INSERT INTO faq_items (group_id, question, answer, sort_order) VALUES (?, ?, ?, ?)`
        ).run(groupId, it.question, it.answer, it.sort_order)
        totalItems++
      }
    }
    console.log(`✓ faq_groups (${seedData.faq_groups.length}) + faq_items (${totalItems})`)
  })

  await run()
  console.log("\nSeed tamamlandı.")
  process.exit(0)
}

main().catch((err) => {
  console.error("Seed başarısız:", err)
  process.exit(1)
})
