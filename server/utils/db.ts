import { Pool } from "pg"
import type { PoolClient } from "pg"
import { AsyncLocalStorage } from "node:async_hooks"
import {
  defaultFooterContactTitle,
  defaultFooterLegalLinks,
  defaultFooterMenuItems,
  defaultFooterMenuTitle,
  defaultFooterServicesTitle,
  defaultHeaderCtaLabel,
  defaultHeaderCtaUrl,
  defaultHeaderMenuItems,
  defaultLogoType,
} from "../../utils/site-settings"
import { resolveHomepageServiceIcon } from "../../utils/homepage-service-icons"
import { defaultThemePaletteId } from "../../utils/theme-palettes"

const DEFAULT_HEADER_MENU_ITEMS_JSON = JSON.stringify(defaultHeaderMenuItems)
const DEFAULT_FOOTER_MENU_ITEMS_JSON = JSON.stringify(defaultFooterMenuItems)
const DEFAULT_FOOTER_LEGAL_LINKS_JSON = JSON.stringify(defaultFooterLegalLinks)

// ─────────────────────────────────────────────
// PostgreSQL bağlantı havuzu
// DATABASE_URL örn: postgresql://user:password@host:5432/dbname
// ─────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const txContext = new AsyncLocalStorage<PoolClient>()

function toPgSql(sql: string): string {
  let i = 0
  return sql.replace(/\?/g, () => `$${++i}`)
}

async function rawQuery(sql: string, params: any[] = []) {
  const client = txContext.getStore()
  if (client) return client.query(sql, params)
  return pool.query(sql, params)
}

interface Stmt {
  run(...params: any[]): Promise<{ lastInsertRowid: number; changes: number }>
  get<T = any>(...params: any[]): Promise<T | undefined>
  all<T = any>(...params: any[]): Promise<T[]>
}

function prepare(sql: string): Stmt {
  const pgSql = toPgSql(sql)
  const isInsert = /^\s*insert/i.test(sql) && !/returning/i.test(sql)
  const runSql = isInsert ? `${pgSql} RETURNING id` : pgSql

  return {
    async run(...params: any[]) {
      const res = await rawQuery(runSql, params)
      return {
        lastInsertRowid: res.rows[0]?.id ?? 0,
        changes: res.rowCount ?? 0,
      }
    },
    async get<T = any>(...params: any[]): Promise<T | undefined> {
      const res = await rawQuery(pgSql, params)
      return res.rows[0] as T | undefined
    },
    async all<T = any>(...params: any[]): Promise<T[]> {
      const res = await rawQuery(pgSql, params)
      return res.rows as T[]
    },
  }
}

async function exec(sql: string): Promise<void> {
  await rawQuery(sql)
}

function transaction<T>(fn: () => Promise<T> | T): () => Promise<T> {
  return async () => {
    const client = await pool.connect()
    try {
      await client.query("BEGIN")
      const result = await txContext.run(client, fn)
      await client.query("COMMIT")
      return result
    } catch (err) {
      await client.query("ROLLBACK")
      throw err
    } finally {
      client.release()
    }
  }
}

export interface Db {
  prepare(sql: string): Stmt
  exec(sql: string): Promise<void>
  transaction<T>(fn: () => Promise<T> | T): () => Promise<T>
}

const db: Db = { prepare, exec, transaction }

let ready: Promise<void> | null = null

export async function getDb(): Promise<Db> {
  if (!ready) ready = initSchema(db)
  await ready
  return db
}

async function initSchema(db: Db) {
  await db.exec(`
    -- Site ayarları (tek satır)
    CREATE TABLE IF NOT EXISTS site_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      name TEXT NOT NULL DEFAULT 'Gözde Nakliyat',
      title_suffix TEXT NOT NULL DEFAULT 'Gözde Nakliyat',
      description TEXT NOT NULL DEFAULT '',
      logo_tagline TEXT NOT NULL DEFAULT 'Frigolu · Parsiyel · Kara Taşımacılığı',
      footer_tagline TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      phone_display TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      address_street TEXT NOT NULL DEFAULT '',
      address_region TEXT NOT NULL DEFAULT '',
      address_city TEXT NOT NULL DEFAULT '',
      working_hours TEXT NOT NULL DEFAULT '',
      maps_url TEXT NOT NULL DEFAULT '',
      social_instagram TEXT NOT NULL DEFAULT '',
      social_linkedin TEXT NOT NULL DEFAULT '',
      theme_palette TEXT NOT NULL DEFAULT 'gold',
      custom_theme_enabled INTEGER NOT NULL DEFAULT 0,
      custom_primary TEXT NOT NULL DEFAULT '#c9a35a',
      custom_primary_deep TEXT NOT NULL DEFAULT '#9a7030',
      custom_surface_dark TEXT NOT NULL DEFAULT '#2a3347',
      custom_accent_contrast TEXT NOT NULL DEFAULT '#1a1209',
      hero_image TEXT NOT NULL DEFAULT '',
      og_image TEXT NOT NULL DEFAULT '',
      favicon TEXT NOT NULL DEFAULT '',
      logo_type TEXT NOT NULL DEFAULT 'text',
      logo_image TEXT NOT NULL DEFAULT '',
      header_cta_label TEXT NOT NULL DEFAULT 'Randevu Al',
      header_cta_url TEXT NOT NULL DEFAULT '/iletisim',
      header_menu_items TEXT NOT NULL DEFAULT '[{"label":"Ana Sayfa","to":"/","type":"link"},{"label":"Hakkımda","to":"/hakkimda","type":"link"},{"label":"Hizmetler","to":"","type":"services"},{"label":"Blog","to":"/blog","type":"link"},{"label":"SSS","to":"/sss","type":"link"},{"label":"İletişim","to":"/iletisim","type":"link"}]',
      footer_services_title TEXT NOT NULL DEFAULT 'Hizmetler',
      footer_menu_title TEXT NOT NULL DEFAULT 'Kurumsal',
      footer_menu_items TEXT NOT NULL DEFAULT '[{"label":"Hakkımda","to":"/hakkimda"},{"label":"Blog","to":"/blog"},{"label":"Sık Sorulan Sorular","to":"/sss"},{"label":"Randevu Al","to":"/iletisim"}]',
      footer_contact_title TEXT NOT NULL DEFAULT 'İletişim',
      footer_bottom_text TEXT NOT NULL DEFAULT '',
      footer_legal_links TEXT NOT NULL DEFAULT '[{"label":"Gizlilik Politikası","to":"/gizlilik"},{"label":"Kullanım Koşulları","to":"/kullanim-kosullari"},{"label":"KVKK","to":"/kvkk"}]'
    );

    -- SSS kategorileri
    CREATE TABLE IF NOT EXISTS faq_groups (
      id SERIAL PRIMARY KEY,
      category TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    -- SSS soruları
    CREATE TABLE IF NOT EXISTS faq_items (
      id SERIAL PRIMARY KEY,
      group_id INTEGER NOT NULL REFERENCES faq_groups(id) ON DELETE CASCADE,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    -- Yasal sayfalar (slug: gizlilik, kullanim-kosullari, kvkk)
    CREATE TABLE IF NOT EXISTS legal_pages (
      id SERIAL PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (now()::text)
    );

    -- Hakkımda sayfası (tek satır)
    CREATE TABLE IF NOT EXISTS about_page (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      hero_eyebrow TEXT NOT NULL DEFAULT '2000''den bu yana tercih edilen ilk isim',
      hero_title TEXT NOT NULL DEFAULT 'Hakkımızda',
      hero_lead TEXT NOT NULL DEFAULT '',
      hero_bg_image TEXT NOT NULL DEFAULT '',
      photo_url TEXT NOT NULL DEFAULT '',
      bio_title TEXT NOT NULL DEFAULT 'Gözde Nakliyat',
      bio_paragraphs TEXT NOT NULL DEFAULT '[]',
      bio_badge_value TEXT NOT NULL DEFAULT '',
      bio_badge_label TEXT NOT NULL DEFAULT '',
      specialties TEXT NOT NULL DEFAULT '[]',
      hero_badges TEXT NOT NULL DEFAULT '[]',
      timeline TEXT NOT NULL DEFAULT '[]',
      approach_title TEXT NOT NULL DEFAULT 'Çalışma Prensiplerimiz',
      approach_lead TEXT NOT NULL DEFAULT '',
      approach_values TEXT NOT NULL DEFAULT '[]',
      cta_title TEXT NOT NULL DEFAULT 'Hızlı teklif almak ister misiniz?',
      cta_text TEXT NOT NULL DEFAULT '',
      cta_bg_image TEXT NOT NULL DEFAULT '',
      cta_primary_label TEXT NOT NULL DEFAULT 'Hızlı Teklif İste',
      cta_primary_url TEXT NOT NULL DEFAULT '/iletisim',
      cta_secondary_label TEXT NOT NULL DEFAULT 'Frigolu Taşıma',
      cta_secondary_url TEXT NOT NULL DEFAULT '/frigolu-tasima'
    );

    -- Blog yazıları
    CREATE TABLE IF NOT EXISTS blog_posts (
      id SERIAL PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      excerpt TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '',
      quote TEXT NOT NULL DEFAULT '',
      read_time TEXT NOT NULL DEFAULT '',
      date TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL DEFAULT '',
      hero_bg_image TEXT NOT NULL DEFAULT '',
      featured INTEGER NOT NULL DEFAULT 0,
      published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (now()::text),
      updated_at TEXT NOT NULL DEFAULT (now()::text)
    );

    -- Anasayfa içeriği (tek satır)
    CREATE TABLE IF NOT EXISTS homepage (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      hero_eyebrow TEXT NOT NULL DEFAULT '2000''den bu yana tercih edilen ilk isim',
      hero_title TEXT NOT NULL DEFAULT 'Türkiye ve Avrupa genelinde güvenilir lojistik çözümleri',
      hero_description TEXT NOT NULL DEFAULT 'Frigolu taşıma, kara taşımacılığı, parsiyel taşıma ve özel operasyonlarda yüklerinizi planlı, hızlı ve güvenli şekilde taşıyoruz.',
      hero_badge1 TEXT NOT NULL DEFAULT '-26 C''ye kadar frigolu taşıma',
      hero_badge2 TEXT NOT NULL DEFAULT 'Parsiyel ve komple yüklemeler',
      hero_badge3 TEXT NOT NULL DEFAULT 'C2 yetki belgeli operasyon',
      hero_bg_image TEXT NOT NULL DEFAULT '',
      hero_images TEXT NOT NULL DEFAULT '[]',
      hero_primary_label TEXT NOT NULL DEFAULT 'Teklif Alın',
      hero_primary_url TEXT NOT NULL DEFAULT '/iletisim',
      hero_secondary_label TEXT NOT NULL DEFAULT 'Kurumsal',
      hero_secondary_url TEXT NOT NULL DEFAULT '/hakkimda',
      accreditations TEXT NOT NULL DEFAULT '[]',
      about_eyebrow TEXT NOT NULL DEFAULT 'Hakkımda',
      about_title TEXT NOT NULL DEFAULT '20 yılı aşkın sektör deneyimi',
      about_role TEXT NOT NULL DEFAULT 'Frigolu, Kara, Parsiyel ve Özel Taşımacılık',
      about_paragraph1 TEXT NOT NULL DEFAULT '',
      about_paragraph2 TEXT NOT NULL DEFAULT '',
      about_photo TEXT NOT NULL DEFAULT '',
      services_eyebrow TEXT NOT NULL DEFAULT 'Hizmetlerimiz',
      services_title TEXT NOT NULL DEFAULT 'Taşıma ihtiyaçlarınıza uygun çözümler',
      services_description TEXT NOT NULL DEFAULT 'Frigolu, kara, parsiyel, banka, fuar ve tıbbi cihaz taşımalarında yük tipine göre doğru operasyon modelini sunuyoruz.',
      services_bg_image TEXT NOT NULL DEFAULT '',
      process_eyebrow TEXT NOT NULL DEFAULT 'Nasıl Çalışıyoruz?',
      process_title TEXT NOT NULL DEFAULT 'Tekliften teslimata operasyon akışı',
      process_description TEXT NOT NULL DEFAULT 'Hızlı teklif, doğru araç planı, takip ve zamanında teslim odaklı çalışıyoruz.',
      process_steps TEXT NOT NULL DEFAULT '[]',
      testimonials_eyebrow TEXT NOT NULL DEFAULT 'Kurumsal Güven',
      testimonials_title TEXT NOT NULL DEFAULT 'Neden Gözde Nakliyat?',
      testimonials_description TEXT NOT NULL DEFAULT 'Parsiyel ve komple yüklemelerden kapıdan kapıya teslimata kadar süreçlerimizi güven, hız ve planlama odağında yürütüyoruz.',
      cta_title TEXT NOT NULL DEFAULT 'Hızlı teklif isteyin',
      cta_description TEXT NOT NULL DEFAULT 'Parsiyel ve komple yüklemelerden tıbbi cihaz taşımasına kadar sevkiyat detaylarınızı paylaşın, size uygun çözümü hazırlayalım.',
      cta_bg_image TEXT NOT NULL DEFAULT '',
      cta_primary_label TEXT NOT NULL DEFAULT 'Hızlı Teklif İste',
      cta_primary_url TEXT NOT NULL DEFAULT '/iletisim',
      cta_secondary_label TEXT NOT NULL DEFAULT 'Frigolu Taşıma',
      cta_secondary_url TEXT NOT NULL DEFAULT '/frigolu-tasima',
      services_items TEXT NOT NULL DEFAULT '[]'
    );

    -- Randevular / İletişim formları
    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      service TEXT NOT NULL DEFAULT '',
      message TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (now()::text)
    );

    -- Admin kullanıcı (tek kullanıcı)
    CREATE TABLE IF NOT EXISTS admin_user (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      username TEXT NOT NULL DEFAULT 'admin',
      password_hash TEXT NOT NULL DEFAULT ''
    );
  `)

  // Varsayılan site ayarlarını ekle
  const existing = await db.prepare("SELECT id FROM site_settings WHERE id = 1").get()
  if (!existing) {
    await db.prepare(`
      INSERT INTO site_settings (id, name, title_suffix, description, logo_tagline, footer_tagline, phone, phone_display, email,
        address_street, address_region, address_city, working_hours, maps_url,
        social_instagram, social_linkedin, hero_image, og_image)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "Gözde Nakliyat",
      "Gözde Nakliyat",
      "Gözde Nakliyat; frigolu taşıma, kara taşımacılığı, parsiyel taşıma, banka taşımacılığı, fuar taşıma ve tıbbi cihaz taşıma alanlarında Türkiye ve Avrupa genelinde hizmet sunar.",
      "Frigolu · Parsiyel · Kara Taşımacılığı",
      "Türkiye ve Avrupa genelinde frigolu, parsiyel, kara, banka, fuar ve tıbbi cihaz taşıma operasyonlarını planlıyoruz.",
      "+904663513210",
      "0 466 351 32 10",
      "bilgi@ev-mobil.com",
      "Ortahopa Mah. Küçükal Sit. A Blok Zemin Kat No:102",
      "Hopa",
      "Artvin",
      "Hafta içi ve hafta sonu kesintisiz hizmet",
      "https://goo.gl/maps/jA2R9Q7iK9KAHzby9",
      "",
      "",
      "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1600&q=80",
      "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1600&q=80"
    )
  } else {
    // Mevcut kayıt varsa yeni sütunları eksikse ekle (migration)
    await db.exec("ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_tagline TEXT NOT NULL DEFAULT 'Frigolu · Parsiyel · Kara Taşımacılığı'")
    await db.exec("ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_tagline TEXT NOT NULL DEFAULT ''")
    await db.exec(`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_type TEXT NOT NULL DEFAULT '${defaultLogoType}'`)
    await db.exec("ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS logo_image TEXT NOT NULL DEFAULT ''")
    await db.exec(`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS header_cta_label TEXT NOT NULL DEFAULT '${defaultHeaderCtaLabel}'`)
    await db.exec(`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS header_cta_url TEXT NOT NULL DEFAULT '${defaultHeaderCtaUrl}'`)
    await db.exec(`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS header_menu_items TEXT NOT NULL DEFAULT '${DEFAULT_HEADER_MENU_ITEMS_JSON}'`)
    await db.exec(`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_services_title TEXT NOT NULL DEFAULT '${defaultFooterServicesTitle}'`)
    await db.exec(`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_menu_title TEXT NOT NULL DEFAULT '${defaultFooterMenuTitle}'`)
    await db.exec(`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_menu_items TEXT NOT NULL DEFAULT '${DEFAULT_FOOTER_MENU_ITEMS_JSON}'`)
    await db.exec(`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_contact_title TEXT NOT NULL DEFAULT '${defaultFooterContactTitle}'`)
    await db.exec("ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_bottom_text TEXT NOT NULL DEFAULT ''")
    await db.exec(`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS footer_legal_links TEXT NOT NULL DEFAULT '${DEFAULT_FOOTER_LEGAL_LINKS_JSON}'`)
    await db.exec(`ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS theme_palette TEXT NOT NULL DEFAULT '${defaultThemePaletteId}'`)
    await db.exec("ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS custom_theme_enabled INTEGER NOT NULL DEFAULT 0")
    await db.exec("ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS custom_primary TEXT NOT NULL DEFAULT '#c9a35a'")
    await db.exec("ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS custom_primary_deep TEXT NOT NULL DEFAULT '#9a7030'")
    await db.exec("ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS custom_surface_dark TEXT NOT NULL DEFAULT '#2a3347'")
    await db.exec("ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS custom_accent_contrast TEXT NOT NULL DEFAULT '#1a1209'")
    await db.exec("ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS favicon TEXT NOT NULL DEFAULT ''")
  }

  // Varsayılan admin kullanıcısı (şifre: admin123 — ilk girişte değiştirilmeli)
  const adminExists = await db.prepare("SELECT id FROM admin_user WHERE id = 1").get()
  if (!adminExists) {
    // bcrypt yerine basit hash — production'da değiştirin
    await db.prepare("INSERT INTO admin_user (id, username, password_hash) VALUES (1, 'admin', 'admin123')").run()
  }

  // Varsayılan hakkımda sayfasını ekle
  const aboutExists = await db.prepare("SELECT id FROM about_page WHERE id = 1").get()
  if (!aboutExists) {
    await db.prepare(`
      INSERT INTO about_page (id, hero_eyebrow, hero_title, hero_lead, photo_url,
        bio_title, bio_paragraphs, specialties,
        timeline, approach_title, approach_lead, approach_values, cta_title, cta_text)
      VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "2000'den bu yana tercih edilen ilk isim",
      "Hakkımızda",
      "Uluslararası nakliyat firması olarak sektörde 20 yılı aşkın süredir Türkiye ve Avrupa genelinde hizmet veriyoruz.",
      "",
      "Gözde Nakliyat",
      JSON.stringify([
        "Uluslararası nakliyat firması olarak sektörde 20 yılı aşkın bir süredir hizmet veriyoruz. Deneyim, güven ve profesyonelliği sizlere en iyi şekilde sunmayı hedefliyoruz.",
        "Türkiye ve Avrupa genelinde uluslararası nakliye ve depolama hizmeti sunuyor, son model araçlarımız ve uzman ekibimizle hızlı, güvenli ve kaliteli bir operasyon yönetimi sağlıyoruz."
      ]),
      JSON.stringify([
        { title: "Frigolu Taşıma", desc: "-26 C'ye kadar ısı kontrollü ürünler için planlı soğuk zincir taşımacılığı." },
        { title: "Kara Taşımacılığı", desc: "Türkiye ve Avrupa genelinde komple ve parsiyel kara sevkiyat çözümleri." },
        { title: "Parsiyel Taşıma", desc: "Araç kapasitesini tamamen doldurmayan yükler için ekonomik sevkiyat modeli." },
        { title: "Özel Operasyonlar", desc: "Banka, fuar ve tıbbi cihaz taşımalarında hassas süreç yönetimi." }
      ]),
      JSON.stringify([
        { years: "2000", title: "Sektöre Giriş", desc: "2000'den bu yana tercih edilen ilk isim olma hedefiyle lojistik operasyonlarımızı büyüttük." },
        { years: "20+", title: "Deneyim", desc: "20 yılı aşkın deneyimle kurumsal ve bireysel müşterilere güvenilir hizmet sunuyoruz." },
        { years: "C2", title: "Yetki Belgesi", desc: "Taşımacılık sektöründe zorunlu olan sertifikalar ile C2 eşya taşıma yetki belgesine sahibiz." },
        { years: "7/24", title: "Süreklilik", desc: "Hafta içi ve hafta sonu kesintisiz operasyon anlayışıyla sevkiyat süreçlerini sürdürüyoruz." }
      ]),
      "Çalışma Prensiplerimiz",
      "Deneyim, güven ve profesyonelliği teknoloji destekli süreçlerle birleştirerek hızlı, güvenli ve kaliteli hizmet sunuyoruz.",
      JSON.stringify([
        { title: "Deneyim", desc: "Yıllara yayılan saha deneyimini her operasyonda planlı karar alma süreciyle birleştiriyoruz." },
        { title: "Güven", desc: "Teslimat sürecinin tüm aşamalarında yük güvenliğini ve müşteri memnuniyetini önceliklendiriyoruz." },
        { title: "Teknoloji ve Takip", desc: "Araç takibi ve operasyon görünürlüğü ile yüklerin konumunu ve teslim zamanını kontrollü biçimde yönetiyoruz." }
      ]),
      "Hızlı teklif almak ister misiniz?",
      "Yük tipinizi ve teslim noktanızı paylaşın, size uygun sevkiyat planını oluşturalım."
    )
  } else {
    // Migration: yeni sütunlar ekle
    await db.exec("ALTER TABLE about_page ADD COLUMN IF NOT EXISTS photo_url TEXT NOT NULL DEFAULT ''")
    await db.exec("ALTER TABLE about_page ADD COLUMN IF NOT EXISTS hero_bg_image TEXT NOT NULL DEFAULT ''")
    await db.exec("ALTER TABLE about_page ADD COLUMN IF NOT EXISTS cta_bg_image TEXT NOT NULL DEFAULT ''")
    await db.exec("ALTER TABLE about_page ADD COLUMN IF NOT EXISTS cta_primary_label TEXT NOT NULL DEFAULT 'Hızlı Teklif İste'")
    await db.exec("ALTER TABLE about_page ADD COLUMN IF NOT EXISTS cta_primary_url TEXT NOT NULL DEFAULT '/iletisim'")
    await db.exec("ALTER TABLE about_page ADD COLUMN IF NOT EXISTS cta_secondary_label TEXT NOT NULL DEFAULT 'Frigolu Taşıma'")
    await db.exec("ALTER TABLE about_page ADD COLUMN IF NOT EXISTS cta_secondary_url TEXT NOT NULL DEFAULT '/frigolu-tasima'")
    await db.exec("ALTER TABLE about_page ADD COLUMN IF NOT EXISTS bio_badge_value TEXT NOT NULL DEFAULT ''")
    await db.exec("ALTER TABLE about_page ADD COLUMN IF NOT EXISTS bio_badge_label TEXT NOT NULL DEFAULT ''")
    await db.exec("ALTER TABLE about_page ADD COLUMN IF NOT EXISTS hero_badges TEXT NOT NULL DEFAULT '[]'")
  }

  // Appointments migration: yeni sütunlar
  await db.exec("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS first_visit_date TEXT NOT NULL DEFAULT ''")
  await db.exec("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS issue_date TEXT NOT NULL DEFAULT ''")
  await db.exec("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS session_count INTEGER NOT NULL DEFAULT 0")
  await db.exec("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'request'")
  await db.exec("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_date TEXT NOT NULL DEFAULT ''")
  await db.exec("ALTER TABLE appointments ADD COLUMN IF NOT EXISTS appointment_time TEXT NOT NULL DEFAULT ''")

  // Blog migration: yeni sütunlar
  await db.exec("ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS hero_bg_image TEXT NOT NULL DEFAULT ''")

  // İletişim sayfası (tek satır)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS contact_page (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      hero_eyebrow    TEXT NOT NULL DEFAULT 'İletişim',
      hero_title      TEXT NOT NULL DEFAULT 'İletişim ve Hızlı Teklif',
      hero_lead       TEXT NOT NULL DEFAULT 'Merkez ofis ve depo bilgilerimiz üzerinden bize ulaşabilir, hızlı teklif formu ile sevkiyat talebinizi iletebilirsiniz.',
      hero_bg_image   TEXT NOT NULL DEFAULT '',
      info_title      TEXT NOT NULL DEFAULT 'İletişim Bilgileri',
      info_lead       TEXT NOT NULL DEFAULT 'Merkez ofis ve depo kanallarımız üzerinden operasyon detaylarınızı paylaşabilirsiniz.',
      contact_email   TEXT NOT NULL DEFAULT '',
      form_title      TEXT NOT NULL DEFAULT 'Hızlı Teklif Talebi',
      form_lead       TEXT NOT NULL DEFAULT 'Frigolu, kara, parsiyel, banka, fuar veya tıbbi cihaz taşımalarınız için temel bilgileri paylaşın, size geri dönelim.',
      cta_title       TEXT NOT NULL DEFAULT 'Hızlı Ulaşım',
      cta_lead        TEXT NOT NULL DEFAULT 'Form yerine telefon veya e-posta üzerinden de doğrudan ulaşabilirsiniz.',
      cta_bg_image    TEXT NOT NULL DEFAULT '',
      cta_primary_label TEXT NOT NULL DEFAULT 'E-posta Gönder',
      cta_primary_url TEXT NOT NULL DEFAULT '',
      cta_secondary_label TEXT NOT NULL DEFAULT 'Telefon Et',
      cta_secondary_url TEXT NOT NULL DEFAULT ''
    )
  `)
  const contactExists = await db.prepare("SELECT id FROM contact_page WHERE id = 1").get()
  if (!contactExists) {
    await db.prepare(`INSERT INTO contact_page (id) VALUES (1)`).run()
  }
  await db.exec("ALTER TABLE contact_page ADD COLUMN IF NOT EXISTS cta_bg_image TEXT NOT NULL DEFAULT ''")
  await db.exec("ALTER TABLE contact_page ADD COLUMN IF NOT EXISTS contact_email TEXT NOT NULL DEFAULT ''")
  await db.exec("ALTER TABLE contact_page ADD COLUMN IF NOT EXISTS cta_primary_label TEXT NOT NULL DEFAULT 'E-posta Gönder'")
  await db.exec("ALTER TABLE contact_page ADD COLUMN IF NOT EXISTS cta_primary_url TEXT NOT NULL DEFAULT ''")
  await db.exec("ALTER TABLE contact_page ADD COLUMN IF NOT EXISTS cta_secondary_label TEXT NOT NULL DEFAULT 'Telefon Et'")
  await db.exec("ALTER TABLE contact_page ADD COLUMN IF NOT EXISTS cta_secondary_url TEXT NOT NULL DEFAULT ''")

  // Blog listesi sayfası
  await db.exec(`
    CREATE TABLE IF NOT EXISTS blog_page (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      hero_eyebrow  TEXT NOT NULL DEFAULT 'Lojistik Yazıları',
      hero_title    TEXT NOT NULL DEFAULT 'Blog',
      hero_lead     TEXT NOT NULL DEFAULT 'Lojistik, tedarik zinciri ve uluslararası taşımacılık başlıklarında şirketimizin paylaştığı temel içerikleri burada bulabilirsiniz.',
      hero_bg_image TEXT NOT NULL DEFAULT ''
    )
  `)
  const blogPageExists = await db.prepare("SELECT id FROM blog_page WHERE id = 1").get()
  if (!blogPageExists) {
    await db.prepare(`INSERT INTO blog_page (id) VALUES (1)`).run()
  }

  // SSS sayfası
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sss_page (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      hero_eyebrow  TEXT NOT NULL DEFAULT 'Merak Edilenler',
      hero_title    TEXT NOT NULL DEFAULT 'Sık Sorulan Sorular',
      hero_lead     TEXT NOT NULL DEFAULT 'Frigolu, parsiyel, kara, banka, fuar ve tıbbi cihaz taşıma hizmetlerimiz hakkında en çok sorulan soruları burada bulabilirsiniz.',
      hero_bg_image TEXT NOT NULL DEFAULT '',
      cta_title     TEXT NOT NULL DEFAULT 'Cevabını bulamadığınız bir sorunuz mu var?',
      cta_lead      TEXT NOT NULL DEFAULT 'Hızlı teklif veya operasyon detayları için bizimle doğrudan iletişime geçebilirsiniz.',
      cta_bg_image  TEXT NOT NULL DEFAULT '',
      cta_primary_label TEXT NOT NULL DEFAULT 'İletişime Geçin',
      cta_primary_url TEXT NOT NULL DEFAULT '/iletisim',
      cta_secondary_label TEXT NOT NULL DEFAULT 'Hızlı Teklif İste',
      cta_secondary_url TEXT NOT NULL DEFAULT '/iletisim'
    )
  `)
  const sssPageExists = await db.prepare("SELECT id FROM sss_page WHERE id = 1").get()
  if (!sssPageExists) {
    await db.prepare(`INSERT INTO sss_page (id) VALUES (1)`).run()
  }
  await db.exec("ALTER TABLE sss_page ADD COLUMN IF NOT EXISTS cta_bg_image TEXT NOT NULL DEFAULT ''")
  await db.exec("ALTER TABLE sss_page ADD COLUMN IF NOT EXISTS cta_primary_label TEXT NOT NULL DEFAULT 'İletişime Geçin'")
  await db.exec("ALTER TABLE sss_page ADD COLUMN IF NOT EXISTS cta_primary_url TEXT NOT NULL DEFAULT '/iletisim'")
  await db.exec("ALTER TABLE sss_page ADD COLUMN IF NOT EXISTS cta_secondary_label TEXT NOT NULL DEFAULT 'Randevu Alın'")
  await db.exec("ALTER TABLE sss_page ADD COLUMN IF NOT EXISTS cta_secondary_url TEXT NOT NULL DEFAULT '/iletisim'")

  // Hizmet sayfaları (bireysel, çift, online)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS service_pages (
      id           SERIAL PRIMARY KEY,
      slug         TEXT NOT NULL UNIQUE,
      hero_eyebrow TEXT NOT NULL DEFAULT 'Lojistik Çözümü',
      hero_title   TEXT NOT NULL DEFAULT '',
      hero_lead    TEXT NOT NULL DEFAULT '',
      hero_bg_image TEXT NOT NULL DEFAULT '',
      what_title   TEXT NOT NULL DEFAULT '',
      what_lead    TEXT NOT NULL DEFAULT '',
      benefits     TEXT NOT NULL DEFAULT '[]',
      issues_title TEXT NOT NULL DEFAULT 'Hangi Operasyonlarda Kullanılır?',
      issues_lead  TEXT NOT NULL DEFAULT '',
      issues       TEXT NOT NULL DEFAULT '[]',
      process_title TEXT NOT NULL DEFAULT 'Operasyon Süreci Nasıl İlerler?',
      process_lead  TEXT NOT NULL DEFAULT '',
      process_steps TEXT NOT NULL DEFAULT '[]',
      cta_title    TEXT NOT NULL DEFAULT 'Hızlı teklif almak ister misiniz?',
      cta_lead     TEXT NOT NULL DEFAULT '',
      cta_bg_image TEXT NOT NULL DEFAULT '',
      cta_primary_label TEXT NOT NULL DEFAULT 'Hızlı Teklif İste',
      cta_primary_url TEXT NOT NULL DEFAULT '/iletisim',
      cta_secondary_label TEXT NOT NULL DEFAULT 'Kurumsal',
      cta_secondary_url TEXT NOT NULL DEFAULT '/hakkimda'
    )
  `)
  await db.exec("ALTER TABLE service_pages ADD COLUMN IF NOT EXISTS cta_bg_image TEXT NOT NULL DEFAULT ''")
  await db.exec("ALTER TABLE service_pages ADD COLUMN IF NOT EXISTS cta_primary_label TEXT NOT NULL DEFAULT 'Hızlı Teklif İste'")
  await db.exec("ALTER TABLE service_pages ADD COLUMN IF NOT EXISTS cta_primary_url TEXT NOT NULL DEFAULT '/iletisim'")
  await db.exec("ALTER TABLE service_pages ADD COLUMN IF NOT EXISTS cta_secondary_label TEXT NOT NULL DEFAULT 'Kurumsal'")
  await db.exec("ALTER TABLE service_pages ADD COLUMN IF NOT EXISTS cta_secondary_url TEXT NOT NULL DEFAULT '/hakkimda'")

  // Hizmetler ana sayfası
  await db.exec(`
    CREATE TABLE IF NOT EXISTS services_page (
      id           INTEGER PRIMARY KEY CHECK (id = 1),
      hero_eyebrow TEXT NOT NULL DEFAULT 'Hizmetlerimiz',
      hero_title   TEXT NOT NULL DEFAULT 'Taşıma Çözümlerimiz',
      hero_lead    TEXT NOT NULL DEFAULT 'Frigolu, kara, parsiyel, banka, fuar ve tıbbi cihaz taşımalarında yük tipine göre doğru operasyon modelini planlıyoruz.',
      hero_bg_image TEXT NOT NULL DEFAULT '',
      intro_title  TEXT NOT NULL DEFAULT 'Nasıl Yardımcı Olabiliriz?',
      intro_lead   TEXT NOT NULL DEFAULT 'Yük tipi, teslim noktası ve termin bilgisine göre size uygun taşıma çözümünü oluşturuyoruz.',
      cta_title    TEXT NOT NULL DEFAULT 'Hızlı teklif almak ister misiniz?',
      cta_lead     TEXT NOT NULL DEFAULT 'Sevkiyat detaylarınızı paylaşın, operasyon planınızı birlikte netleştirelim.',
      cta_bg_image TEXT NOT NULL DEFAULT '',
      cta_primary_label TEXT NOT NULL DEFAULT 'Hızlı Teklif İste',
      cta_primary_url TEXT NOT NULL DEFAULT '/iletisim',
      cta_secondary_label TEXT NOT NULL DEFAULT 'İletişime Geçin',
      cta_secondary_url TEXT NOT NULL DEFAULT '/iletisim'
    )
  `)
  const servicesPageExists = await db.prepare("SELECT id FROM services_page WHERE id = 1").get()
  if (!servicesPageExists) {
    await db.prepare(`INSERT INTO services_page (id) VALUES (1)`).run()
  }
  await db.exec("ALTER TABLE services_page ADD COLUMN IF NOT EXISTS cta_bg_image TEXT NOT NULL DEFAULT ''")
  await db.exec("ALTER TABLE services_page ADD COLUMN IF NOT EXISTS cta_primary_label TEXT NOT NULL DEFAULT 'Hızlı Teklif İste'")
  await db.exec("ALTER TABLE services_page ADD COLUMN IF NOT EXISTS cta_primary_url TEXT NOT NULL DEFAULT '/iletisim'")
  await db.exec("ALTER TABLE services_page ADD COLUMN IF NOT EXISTS cta_secondary_label TEXT NOT NULL DEFAULT 'İletişime Geçin'")
  await db.exec("ALTER TABLE services_page ADD COLUMN IF NOT EXISTS cta_secondary_url TEXT NOT NULL DEFAULT '/iletisim'")

  // Admin notlar tablosu (notluk / hatırlatıcı)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS admin_notes (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      remind_at TEXT NOT NULL DEFAULT '',
      color TEXT NOT NULL DEFAULT 'yellow',
      pinned INTEGER NOT NULL DEFAULT 0,
      done INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (now()::text),
      updated_at TEXT NOT NULL DEFAULT (now()::text)
    )
  `)

  // Mobil story şeridi (sadece mobilde görünür, admin'den yönetilir)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS stories (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      image TEXT NOT NULL DEFAULT '',
      link_label TEXT NOT NULL DEFAULT '',
      link_url TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (now()::text)
    )
  `)

  // Varsayılan anasayfa içeriğini ekle
  const homepageExists = await db.prepare("SELECT id FROM homepage WHERE id = 1").get()
  if (!homepageExists) {
    await db.prepare(`
      INSERT INTO homepage (id,
        hero_eyebrow, hero_title, hero_description, hero_badge1, hero_badge2, hero_badge3,
        accreditations,
        about_eyebrow, about_title, about_role, about_paragraph1, about_paragraph2, about_photo,
        services_eyebrow, services_title, services_description,
        process_eyebrow, process_title, process_description, process_steps,
        testimonials_eyebrow, testimonials_title, testimonials_description,
        cta_title, cta_description
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "2000'den bu yana tercih edilen ilk isim",
      "Türkiye ve Avrupa genelinde güvenilir lojistik çözümleri",
      "Frigolu taşıma, kara taşımacılığı, parsiyel taşıma ve özel operasyonlarda yüklerinizi planlı, hızlı ve güvenli şekilde taşıyoruz.",
      "-26 C'ye kadar frigolu taşıma",
      "Parsiyel ve komple yüklemeler",
      "C2 yetki belgeli operasyon",
      JSON.stringify([
        { icon: "snowflake", label: "-26 C'ye kadar frigolu taşıma" },
        { icon: "truck",  label: "Parsiyel ve komple yüklemeler" },
        { icon: "shield", label: "C2 yetki belgeli operasyon" },
      ]),
      "Hakkımda",
      "20 yılı aşkın sektör deneyimi",
      "Frigolu, Kara, Parsiyel ve Özel Taşımacılık",
      "Nakliyat sektöründeki amacımız her zaman sektörün lider, tercih edilen ve müşteri memnuniyetini en üst düzeyde tutabilen firması olmaktır.",
      "Türkiye'nin tüm il ve ilçelerinde, ayrıca Avrupa hatlarında; ağır nakliyat, şehirler arası nakliyat, uluslararası sigortalı taşımacılık ve depolama hizmetleri sunuyoruz.",
      "",
      "Hizmetlerimiz",
      "Taşıma ihtiyaçlarınıza uygun çözümler",
      "Frigolu, kara, parsiyel, banka, fuar ve tıbbi cihaz taşımalarında yük tipine göre doğru operasyon modelini sunuyoruz.",
      "Nasıl Çalışıyoruz?",
      "Tekliften teslimata operasyon akışı",
      "Hızlı teklif, doğru araç planı, takip ve zamanında teslim odaklı çalışıyoruz.",
      JSON.stringify([
        { number: "1", title: "Teklif ve Planlama", description: "Yük tipi, teslim noktası ve termin bilgisi alınarak size uygun operasyon modeli oluşturulur." },
        { number: "2", title: "Araç ve Yükleme Organizasyonu", description: "Uygun araç filosu, uzman ekip ve yükleme düzeni operasyon öncesinde netleştirilir." },
        { number: "3", title: "Sevkiyat, Takip ve Teslim", description: "Araç takibi ve süreç bilgilendirmesi ile yükleriniz zamanında teslim edilir." },
      ]),
      "Kurumsal Güven",
      "Neden Gözde Nakliyat?",
      "Parsiyel ve komple yüklemelerden kapıdan kapıya teslimata kadar süreçlerimizi güven, hız ve planlama odağında yürütüyoruz.",
      "Hızlı teklif isteyin",
      "Parsiyel ve komple yüklemelerden tıbbi cihaz taşımasına kadar sevkiyat detaylarınızı paylaşın, size uygun çözümü hazırlayalım."
    )
  }
  await db.exec("ALTER TABLE homepage ADD COLUMN IF NOT EXISTS hero_bg_image TEXT NOT NULL DEFAULT ''")
  await db.exec("ALTER TABLE homepage ADD COLUMN IF NOT EXISTS hero_images TEXT NOT NULL DEFAULT '[]'")
  await db.exec("ALTER TABLE homepage ADD COLUMN IF NOT EXISTS hero_primary_label TEXT NOT NULL DEFAULT 'Teklif Alın'")
  await db.exec("ALTER TABLE homepage ADD COLUMN IF NOT EXISTS hero_primary_url TEXT NOT NULL DEFAULT '/iletisim'")
  await db.exec("ALTER TABLE homepage ADD COLUMN IF NOT EXISTS hero_secondary_label TEXT NOT NULL DEFAULT 'Kurumsal'")
  await db.exec("ALTER TABLE homepage ADD COLUMN IF NOT EXISTS hero_secondary_url TEXT NOT NULL DEFAULT '/hakkimda'")
  await db.exec("ALTER TABLE homepage ADD COLUMN IF NOT EXISTS services_bg_image TEXT NOT NULL DEFAULT ''")
  await db.exec("ALTER TABLE homepage ADD COLUMN IF NOT EXISTS cta_bg_image TEXT NOT NULL DEFAULT ''")
  await db.exec("ALTER TABLE homepage ADD COLUMN IF NOT EXISTS cta_primary_label TEXT NOT NULL DEFAULT 'Hızlı Teklif İste'")
  await db.exec("ALTER TABLE homepage ADD COLUMN IF NOT EXISTS cta_primary_url TEXT NOT NULL DEFAULT '/iletisim'")
  await db.exec("ALTER TABLE homepage ADD COLUMN IF NOT EXISTS cta_secondary_label TEXT NOT NULL DEFAULT 'Frigolu Taşıma'")
  await db.exec("ALTER TABLE homepage ADD COLUMN IF NOT EXISTS cta_secondary_url TEXT NOT NULL DEFAULT '/frigolu-tasima'")

  const legacyHeroImageRow = await db.prepare("SELECT hero_image FROM site_settings WHERE id = 1").get()
  const legacyHeroImage = legacyHeroImageRow?.hero_image || ""
  if (legacyHeroImage) {
    await db.prepare(`
      UPDATE homepage
      SET hero_bg_image = ?
      WHERE id = 1 AND TRIM(COALESCE(hero_bg_image, '')) = ''
    `).run(legacyHeroImage)
  }
  await db.prepare(`
    UPDATE homepage
    SET services_bg_image = COALESCE(NULLIF(hero_bg_image, ''), ?)
    WHERE id = 1 AND TRIM(COALESCE(services_bg_image, '')) = ''
  `).run(legacyHeroImage)

  await applyGozdeNakliyatPreset(db)
}

async function applyGozdeNakliyatPreset(db: Db) {
  const row = await db.prepare(`
    SELECT name, title_suffix, logo_tagline, email, phone_display, address_street
    FROM site_settings
    WHERE id = 1
  `).get()
  if (!row) return

  const brandFingerprint = `${row.name || ""} ${row.title_suffix || ""} ${row.logo_tagline || ""}`.toLowerCase()
  const hasLegacyPsychBrand =
    brandFingerprint.includes("nurgül yaren") ||
    brandFingerprint.includes("psikoterapist") ||
    brandFingerprint.includes("bakırköy")
  const hasAsciiGozdeBrand = brandFingerprint.includes("gozde nakliyat")
  const hasTurkishGozdeBrand = brandFingerprint.includes("gözde nakliyat")
  const serviceSlugRows = await db.prepare("SELECT slug FROM service_pages").all()
  const serviceSlugs = serviceSlugRows.map((item: any) => item.slug)
  const hasLegacySampleServices = serviceSlugs.some((slug: string) =>
    ["evden-eve-nakliyat", "ofis-tasimaciligi", "sehirler-arasi-nakliyat"].includes(slug),
  )
  const hasPlaceholderContact =
    row.email === "info@gozdenakliyat.com" ||
    row.phone_display === "0555 555 55 55" ||
    String(row.address_street || "").includes("Örnek Mah")
  const hasGozdeBrand = hasAsciiGozdeBrand || hasTurkishGozdeBrand

  if (!hasLegacyPsychBrand && !hasLegacySampleServices && !hasPlaceholderContact && !hasGozdeBrand) {
    return
  }

  const officialLogo = "https://www.gozdenakliyat.com.tr/wp-content/uploads/2020/07/logo-dark.png"
  const heroImage = "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1600&q=80"
  const aboutImage = "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?auto=format&fit=crop&w=1400&q=80"
  const blogImage1 = "https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1200&q=80"
  const blogImage2 = "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80"
  const blogImage3 = "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80"

  const services = [
    {
      slug: "frigolu-tasima",
      heroEyebrow: "Isı Kontrollü Operasyon",
      heroTitle: "Frigolu Taşıma",
      heroLead: "Gıda ve ısı hassasiyeti bulunan ürünlerde frigolu araçlarımızla soğuk zinciri koruyan planlı taşıma hizmeti sunuyoruz.",
      whatTitle: "Frigolu Taşıma Nedir?",
      whatLead: "Frigolu taşıma; ısı kontrollü ürünlerin uygun sıcaklık aralığında, doğru araç ve teslim planı ile sevk edilmesini kapsayan özel bir lojistik hizmetidir.",
      benefits: JSON.stringify([
        { title: "Isı Kontrollü Araçlar", text: "Sıcaklık hassasiyeti bulunan yükler için uygun frigolu araç seçimi ile süreç boyunca ürün güvenliği korunur." },
        { title: "Zamanında Teslim", text: "Soğuk zincirde gecikme riskini azaltmak için rota ve teslim penceresi önceden netleştirilir." },
        { title: "Takip ve Bilgilendirme", text: "Uydu üzerinden araç takibi ve operasyon bilgisi ile sevkiyat görünür şekilde yönetilir." },
      ]),
      issuesTitle: "Hangi Yükler İçin Uygun?",
      issuesLead: "Frigolu taşıma; sıcaklık stabilitesi ve hızlı teslim gerektiren operasyonlarda tercih edilir.",
      issues: JSON.stringify([
        "Gıda ve soğuk zincir ürünleri",
        "Isı kontrollü market sevkiyatları",
        "Yurt içi ve yurt dışı frigorifik taşımalar",
        "Düzenli hat sevkiyatları",
        "Kapıdan kapıya teslim talepleri",
        "Depolama destekli dağıtım operasyonları",
      ]),
      processTitle: "Frigolu Sevkiyat Nasıl İlerler?",
      processLead: "Yük tipi, sıcaklık değeri ve teslim penceresi netleştirilerek operasyon planı oluşturulur.",
      processSteps: JSON.stringify([
        { title: "Sıcaklık ve Yük Planlaması", text: "Yükün korunması gereken sıcaklık aralığı ile teslim süresi birlikte değerlendirilir." },
        { title: "Kontrollü Yükleme", text: "Ürünler frigolu araca düzenli biçimde alınır ve sevkiyat boyunca sıcaklık takibi sürdürülür." },
        { title: "Teslim ve Son Kontrol", text: "Varış noktasında teslim hızla tamamlanır ve yük koşulları doğrulanarak süreç kapatılır." },
      ]),
      ctaTitle: "Frigolu taşıma planınızı oluşturalım",
      ctaLead: "Yük tipinizi ve hedef sıcaklık değerini paylaşın, size uygun frigolu sevkiyat çözümünü hazırlayalım.",
    },
    {
      slug: "kara-tasimaciligi",
      heroEyebrow: "Komple ve Parsiyel Sevkiyat",
      heroTitle: "Kara Taşımacılığı",
      heroLead: "Kara taşımacılığı operasyonlarını zaman, güzergah ve yük tipine göre planlayarak güvenli teslim odaklı yürütüyoruz.",
      whatTitle: "Kara Taşımacılığı Nedir?",
      whatLead: "Kara taşımacılığı; ürünlerin karayolu üzerinden yurt içi veya uluslararası hatlarda, uygun araç ve rota planı ile sevk edilmesini kapsar.",
      benefits: JSON.stringify([
        { title: "Geniş Araç Filosu", text: "Öz mal ve sürekli yenilenen araç filomuzla farklı hacimdeki yükler için esnek taşıma planı kurulabilir." },
        { title: "Rota ve Termin Yönetimi", text: "Teslim tarihi, yük önceliği ve güzergah koşulları birlikte değerlendirilerek operasyon akışı oluşturulur." },
        { title: "Kapıdan Kapıya Hizmet", text: "Yükleme noktasından teslim noktasına kadar süreç tek merkezden takip edilerek müşteriye bilgi aktarılır." },
      ]),
      issuesTitle: "Hangi Operasyonlarda Kullanılır?",
      issuesLead: "Komple ve parsiyel yüklemelerde kara taşımacılığı hem esneklik hem de geniş erişim avantajı sunar.",
      issues: JSON.stringify([
        "Komple kamyon yüklemeleri",
        "Yurt içi dağıtım operasyonları",
        "Türkiye ve Avrupa hat sevkiyatları",
        "Tekstil ve sanayi yükleri",
        "Düzenli tedarik sevkiyatları",
        "Kurumsal kapıdan kapıya taşımalar",
      ]),
      processTitle: "Kara Taşımacılığı Süreci",
      processLead: "Yükün hacmi, teslim noktası ve termin bilgisine göre araç ve rota planı netleştirilir.",
      processSteps: JSON.stringify([
        { title: "Yük Analizi", text: "Yük tipi, hacim, teslim adresi ve özel operasyon ihtiyaçları değerlendirilir." },
        { title: "Araç ve Güzergah Planlaması", text: "En uygun araç tipi, sevkiyat günü ve güzergah operasyon ekibi tarafından belirlenir." },
        { title: "Sevkiyat ve Teslim", text: "Yükler güvenli biçimde sevk edilir, teslimat aşamasına kadar süreç aktif takip ile yürütülür." },
      ]),
      ctaTitle: "Kara taşımacılığı teklifinizi alın",
      ctaLead: "Rota, yük tipi ve teslim tarihini paylaşın, size uygun sevkiyat modelini birlikte netleştirelim.",
    },
    {
      slug: "parsiyel-tasima",
      heroEyebrow: "Ekonomik Hat Yönetimi",
      heroTitle: "Parsiyel Taşıma",
      heroLead: "Parsiyel taşımada yüklerinizi uygun hat planlamasıyla birleştiriyor, maliyet ve zaman dengesini koruyan güvenli teslim süreci oluşturuyoruz.",
      whatTitle: "Parsiyel Taşıma Nedir?",
      whatLead: "Parsiyel taşıma; aracın tamamını doldurmayan yüklerin uygun çıkış planı ile başka yüklerle birleştirilerek taşınmasını sağlayan ekonomik bir modeldir.",
      benefits: JSON.stringify([
        { title: "Maliyet Avantajı", text: "Tam araç maliyetine girmeden sevkiyat yapma imkanı sunar ve yük hacmine göre bütçe dengesi sağlar." },
        { title: "Düzenli Çıkışlar", text: "Planlı hat organizasyonu ile parsiyel yükler gecikmeden sevkiyat zincirine dahil edilir." },
        { title: "Güvenli Elleçleme", text: "Yükler aktarma ve istifleme sırasında ürün güvenliği önceliğiyle düzenli biçimde yönetilir." },
      ]),
      issuesTitle: "Hangi Yükler İçin Tercih Edilir?",
      issuesLead: "Parsiyel taşıma, araç kapasitesini doldurmayan ancak düzenli sevk gerektiren operasyonlar için uygundur.",
      issues: JSON.stringify([
        "Araç kapasitesini doldurmayan yükler",
        "Perakende ve dağıtım sevkiyatları",
        "Depo çıkışlı ara hacim yükler",
        "Düzenli rota gerektiren sevkiyatlar",
        "Yurt içi ve yurt dışı grupaj ihtiyaçları",
        "Maliyet odaklı kurumsal yüklemeler",
      ]),
      processTitle: "Parsiyel Süreç Nasıl İşler?",
      processLead: "Yükünüz uygun rota ve çıkış programı içindeki sevkiyatlarla eşleştirilerek operasyon planı oluşturulur.",
      processSteps: JSON.stringify([
        { title: "Hat ve Yük Eşleştirmesi", text: "Yükün çıkış noktası, teslim adresi ve termin bilgisi uygun parsiyel hatla eşleştirilir." },
        { title: "Toplama ve Yükleme", text: "Parsiyel yükler kontrol edilerek teslim sırasına göre araca yerleştirilir." },
        { title: "Teslimat", text: "Yükler planlanan süre içinde teslim noktasına ulaştırılır ve operasyon kapanış bilgisi paylaşılır." },
      ]),
      ctaTitle: "Parsiyel sevkiyat için hızlı teklif alın",
      ctaLead: "Yük ölçünüzü ve teslim hattınızı iletin, uygun çıkış programını sizin için hazırlayalım.",
    },
    {
      slug: "banka-tasimaciligi",
      heroEyebrow: "Kurumsal Güvenlik Odaklı Operasyon",
      heroTitle: "Banka Taşımacılığı",
      heroLead: "Banka taşımacılığında şube ekipmanı, doküman ve operasyon malzemelerini güvenlik önceliğiyle planlı biçimde sevk ediyoruz.",
      whatTitle: "Banka Taşımacılığı Nedir?",
      whatLead: "Banka taşımacılığı; şube ekipmanlarının, arşivlerin ve operasyon malzemelerinin kurumsal güvenlik hassasiyetiyle sevk edilmesini kapsar.",
      benefits: JSON.stringify([
        { title: "Güvenlik Hassasiyeti", text: "Bankacılık operasyonlarında dikkat, zamanlama ve kurumsal gizlilik hassasiyetiyle süreç yönetilir." },
        { title: "Kurumsal Koordinasyon", text: "Şube açılışı, yer değişikliği veya ekipman transferleri ilgili birimlerle koordineli biçimde planlanır." },
        { title: "Kapıdan Kapıya Hizmet", text: "Operasyonlar yükleme noktasından teslim noktasına kadar tek merkezden takip edilir." },
      ]),
      issuesTitle: "Hangi Operasyonları Kapsar?",
      issuesLead: "Banka taşımacılığı; operasyon hassasiyeti yüksek ekipman ve doküman transferlerinde tercih edilir.",
      issues: JSON.stringify([
        "Banka şube taşınmaları",
        "ATM ve teknik ekipman transferleri",
        "Arşiv ve evrak taşımaları",
        "Kasa ve operasyon malzemesi sevkiyatları",
        "Hafta sonu kurumsal operasyonlar",
        "Çok noktalı şube dağıtım planları",
      ]),
      processTitle: "Banka Operasyonu Nasıl Planlanır?",
      processLead: "Taşıma kapsamı, güvenlik ihtiyaçları ve kurumsal zaman penceresi birlikte değerlendirilir.",
      processSteps: JSON.stringify([
        { title: "Operasyon Planlaması", text: "Şube veya ekipman bazlı taşıma ihtiyacı belirlenir, güvenlik ve zamanlama adımları netleştirilir." },
        { title: "Kontrollü Yükleme", text: "Taşıma kapsamındaki malzemeler kategorilere ayrılır ve kurumsal sürece uygun şekilde yüklenir." },
        { title: "Teslim ve Kapanış", text: "Teslimat sonrası operasyon durumu doğrulanır ve kurum tarafına tamamlanma bilgisi aktarılır." },
      ]),
      ctaTitle: "Banka operasyonlarınızı planlı taşıyalım",
      ctaLead: "Şube, ekipman veya arşiv taşıma ihtiyacınızı paylaşın, güvenli operasyon planını oluşturalım.",
    },
    {
      slug: "fuar-tasima",
      heroEyebrow: "Zaman Kritik Etkinlik Operasyonu",
      heroTitle: "Fuar Taşıma",
      heroLead: "Fuar ve etkinlik taşımalarında stant, ekipman ve tanıtım materyallerini kurulum takvimine uygun şekilde taşıyoruz.",
      whatTitle: "Fuar Taşıma Nedir?",
      whatLead: "Fuar taşıma; fuar, sempozyum, konser ve benzeri etkinliklerde kullanılacak ekipmanların zaman kritik şekilde sevk edilmesini kapsar.",
      benefits: JSON.stringify([
        { title: "Zaman Kritik Planlama", text: "Etkinlik takvimi gecikmeyi kaldırmadığı için yükleme ve teslim saatleri net planla yönetilir." },
        { title: "Kurulum Sırasına Uygun Sevkiyat", text: "Stand ve ekipmanlar kurulum sırasına göre düzenlenerek varış noktasında hızlı açılım sağlanır." },
        { title: "Şehirler Arası Organizasyon Desteği", text: "Farklı şehirlerdeki fuar ve etkinlik taşımaları tek operasyon içinde koordine edilebilir." },
      ]),
      issuesTitle: "Hangi Etkinlikler İçin Uygun?",
      issuesLead: "Fuar ve etkinlik taşımaları, kısa termin ve sahaya uygun teslim gerektiren operasyonlarda öne çıkar.",
      issues: JSON.stringify([
        "Fuar stantları",
        "Sempozyum ve etkinlik ekipmanları",
        "Konser ve organizasyon malzemeleri",
        "Tanıtım ürünleri ve stand sistemleri",
        "Kısa terminli etkinlik sevkiyatları",
        "Çok şehirli organizasyon taşımaları",
      ]),
      processTitle: "Fuar Taşıma Süreci",
      processLead: "Kurulum ve söküm saatleri dikkate alınarak yükleme ve teslim penceresi operasyon öncesinde netleştirilir.",
      processSteps: JSON.stringify([
        { title: "Takvim Analizi", text: "Kurulum ve etkinlik saatleri dikkate alınarak operasyon zamanlaması belirlenir." },
        { title: "Sınıflandırma ve Sevk", text: "Stand, ürün ve teknik malzemeler ayrı ayrı planlanarak araca yüklenir." },
        { title: "Varış ve Boşaltma", text: "Etkinlik alanına teslimat planlanan zamanda tamamlanır ve saha akışına uygun boşaltma yapılır." },
      ]),
      ctaTitle: "Etkinlik sevkiyatınızı gecikmeye bırakmayın",
      ctaLead: "Fuar veya etkinlik tarihini paylaşın, kurulum takvimine uygun taşıma planını hazırlayalım.",
    },
    {
      slug: "tibbi-cihaz-tasima",
      heroEyebrow: "Hassas Ekipman Operasyonu",
      heroTitle: "Tıbbi Cihaz Taşıma",
      heroLead: "Tıbbi cihaz taşımalarında hassas ekipmanları uygun sabitleme, dikkatli yükleme ve takip süreçleriyle güvenle taşıyoruz.",
      whatTitle: "Tıbbi Cihaz Taşıma Nedir?",
      whatLead: "Tıbbi cihaz taşıma; medikal ve hassas teknoloji ekipmanlarının uygun koruma, sabitleme ve teslim planı ile sevk edilmesini kapsayan özel bir hizmettir.",
      benefits: JSON.stringify([
        { title: "Hassas Ekipman Yönetimi", text: "Medikal cihazların teknik hassasiyetine uygun istifleme, sabitleme ve taşıma kuralları uygulanır." },
        { title: "Uzman Operasyon Takibi", text: "Tıbbi cihaz taşımaları, ekipman değeri ve kullanım riski gözetilerek kontrollü biçimde yürütülür." },
        { title: "Güvenli Sabitleme", text: "Sarsıntı ve darbeyi azaltacak yükleme düzeni ile cihazlar sevkiyata hazırlanır." },
      ]),
      issuesTitle: "Hangi Cihazlar İçin Uygun?",
      issuesLead: "Tıbbi cihaz taşıma; medikal ekipman, laboratuvar cihazı ve hassas teknoloji ürünlerinde tercih edilir.",
      issues: JSON.stringify([
        "Hastane ve klinik cihaz taşımaları",
        "Laboratuvar ekipmanları",
        "Bakım veya kurulum öncesi sevkiyatlar",
        "Hassas teknoloji ürünleri",
        "Sigortalı özel taşıma ihtiyaçları",
        "Şehirler arası medikal ekipman transferleri",
      ]),
      processTitle: "Tıbbi Cihaz Operasyon Süreci",
      processLead: "Cihazın fiziksel yapısı, hassasiyet seviyesi ve varış noktası değerlendirilerek taşıma modeli belirlenir.",
      processSteps: JSON.stringify([
        { title: "Cihaz ve Risk Analizi", text: "Taşınacak ekipmanın teknik yapısı ve sevkiyat koşulları operasyon öncesinde değerlendirilir." },
        { title: "Koruma ve Yükleme", text: "Cihazlar uygun koruma malzemeleriyle desteklenir ve araç içinde hareket etmeyecek şekilde sabitlenir." },
        { title: "Teslim ve Son Kontrol", text: "Teslimatta ekipmanlar dikkatli biçimde boşaltılır ve operasyon planına uygun şekilde süreç tamamlanır." },
      ]),
      ctaTitle: "Tıbbi cihaz sevkiyatınızı güvenle yönetin",
      ctaLead: "Cihaz tipini ve teslim noktasını paylaşın, hassas operasyon planını birlikte oluşturalım.",
    },
  ]

  const aboutBioParagraphs = [
    "Uluslararası nakliyat firması olarak sektörde 20 yılı aşkın bir süredir hizmet veriyoruz. Deneyim, güven ve profesyonelliği sizlere en iyi şekilde sunmayı hedefliyoruz.",
    "Türkiye ve Avrupa genelinde uluslararası nakliye ve depolama hizmeti sunuyor, son model araçlarımız ve uzman ekibimizle hızlı, güvenli ve kaliteli bir operasyon yönetimi sağlıyoruz.",
  ]
  const aboutSpecialties = [
    { title: "Frigolu Taşıma", desc: "-26 C'ye kadar ısı kontrollü ürünler için planlı soğuk zincir taşımacılığı." },
    { title: "Kara Taşımacılığı", desc: "Türkiye ve Avrupa genelinde komple ve parsiyel kara sevkiyat çözümleri." },
    { title: "Parsiyel Taşıma", desc: "Araç kapasitesini tamamen doldurmayan yükler için ekonomik sevkiyat modeli." },
    { title: "Özel Operasyonlar", desc: "Banka, fuar ve tıbbi cihaz taşımalarında hassas süreç yönetimi." },
  ]
  const aboutTimeline = [
    { years: "2000", title: "Sektöre Giriş", desc: "2000'den bu yana tercih edilen ilk isim olma hedefiyle lojistik operasyonlarımızı büyüttük." },
    { years: "20+", title: "Deneyim", desc: "20 yılı aşkın deneyimle kurumsal ve bireysel müşterilere güvenilir hizmet sunuyoruz." },
    { years: "C2", title: "Yetki Belgesi", desc: "Taşımacılık sektöründe zorunlu olan sertifikalar ile C2 eşya taşıma yetki belgesine sahibiz." },
    { years: "7/24", title: "Süreklilik", desc: "Hafta içi ve hafta sonu kesintisiz operasyon anlayışıyla sevkiyat süreçlerini sürdürüyoruz." },
  ]
  const approachValues = [
    { title: "Deneyim", desc: "Yıllara yayılan saha deneyimini her operasyonda planlı karar alma süreciyle birleştiriyoruz." },
    { title: "Güven", desc: "Teslimat sürecinin tüm aşamalarında yük güvenliğini ve müşteri memnuniyetini önceliklendiriyoruz." },
    { title: "Teknoloji ve Takip", desc: "Araç takibi ve operasyon görünürlüğü ile yüklerin konumunu ve teslim zamanını kontrollü biçimde yönetiyoruz." },
  ]

  const tx = db.transaction(async () => {
    await db.prepare(`
      UPDATE site_settings SET
        name = ?, title_suffix = ?, description = ?, logo_tagline = ?, footer_tagline = ?,
        phone = ?, phone_display = ?, email = ?, address_street = ?, address_region = ?, address_city = ?,
        working_hours = ?, maps_url = ?, social_instagram = ?, social_linkedin = ?,
        theme_palette = ?, hero_image = ?, og_image = ?, logo_type = ?, logo_image = ?,
        header_cta_label = ?, header_cta_url = ?, header_menu_items = ?,
        footer_services_title = ?, footer_menu_title = ?, footer_menu_items = ?,
        footer_contact_title = ?, footer_bottom_text = ?, footer_legal_links = ?
      WHERE id = 1
    `).run(
      "Gözde Nakliyat",
      "Gözde Nakliyat",
      "Gözde Nakliyat; frigolu taşıma, kara taşımacılığı, parsiyel taşıma, banka taşımacılığı, fuar taşıma ve tıbbi cihaz taşıma alanlarında Türkiye ve Avrupa genelinde hizmet sunar.",
      "Frigolu · Parsiyel · Kara Taşımacılığı",
      "Türkiye ve Avrupa genelinde frigolu, parsiyel, kara, banka, fuar ve tıbbi cihaz taşıma operasyonlarını planlıyoruz.",
      "+904663513210",
      "0 466 351 32 10",
      "bilgi@gozdenakliyat.com.tr",
      "Ortahopa Mah. Küçükal Sit. A Blok Zemin Kat No:102",
      "Hopa",
      "Artvin",
      "Hafta içi ve hafta sonu kesintisiz hizmet",
      "https://goo.gl/maps/jA2R9Q7iK9KAHzby9",
      "",
      "",
      defaultThemePaletteId,
      heroImage,
      heroImage,
      "image",
      officialLogo,
      defaultHeaderCtaLabel,
      defaultHeaderCtaUrl,
      DEFAULT_HEADER_MENU_ITEMS_JSON,
      defaultFooterServicesTitle,
      defaultFooterMenuTitle,
      DEFAULT_FOOTER_MENU_ITEMS_JSON,
      defaultFooterContactTitle,
      "Merkez ofis Hopa / Artvin, depo Kartepe / İzmit.",
      DEFAULT_FOOTER_LEGAL_LINKS_JSON,
    )

    await db.prepare(`
      UPDATE about_page SET
        hero_eyebrow = ?, hero_title = ?, hero_lead = ?, hero_bg_image = ?, photo_url = ?,
        bio_title = ?, bio_paragraphs = ?, specialties = ?, timeline = ?,
        approach_title = ?, approach_lead = ?, approach_values = ?,
        cta_title = ?, cta_text = ?, cta_bg_image = ?, cta_primary_label = ?, cta_primary_url = ?,
        cta_secondary_label = ?, cta_secondary_url = ?
      WHERE id = 1
    `).run(
      "2000'den bu yana tercih edilen ilk isim",
      "Hakkımızda",
      "Uluslararası nakliyat firması olarak sektörde 20 yılı aşkın süredir Türkiye ve Avrupa genelinde hizmet veriyoruz.",
      heroImage,
      aboutImage,
      "Gözde Nakliyat",
      JSON.stringify(aboutBioParagraphs),
      JSON.stringify(aboutSpecialties),
      JSON.stringify(aboutTimeline),
      "Çalışma Prensiplerimiz",
      "Deneyim, güven ve profesyonelliği teknoloji destekli süreçlerle birleştirerek hızlı, güvenli ve kaliteli hizmet sunuyoruz.",
      JSON.stringify(approachValues),
      "Hızlı teklif almak ister misiniz?",
      "Yük tipinizi ve teslim noktanızı paylaşın, size uygun sevkiyat planını oluşturalım.",
      heroImage,
      "Hızlı Teklif İste",
      "/iletisim",
      "Frigolu Taşıma",
      "/frigolu-tasima",
    )

    await db.prepare("DELETE FROM blog_posts").run()
    const insertBlog = db.prepare(`
      INSERT INTO blog_posts (slug, title, excerpt, content, category, tags, quote, read_time, date, image, featured, published)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    await insertBlog.run(
      "lojistik-nedir",
      "Lojistik Nedir?",
      "Lojistik; bir ürünün ilk üreticiden son tüketiciye kadar olan nakliye, depolama, gümrükleme, ambalajlama ve dağıtım süreçlerinin bütünüdür.",
      "<p>Lojistik; bir ürünün ilk üreticiden son tüketiciye kadar olan nakliye, depolama, gümrükleme, ambalajlama ve dağıtım gibi tüm süreçlerini ifade eder.</p><p>Doğru ürünü, doğru yerde, doğru zamanda, doğru miktarda ve doğru kalitede sunabilmek lojistiğin temel hedefidir.</p><p>Üretim öncesi, üretim içi ve üretim sonrası süreçler birlikte düşünüldüğünde lojistik, işletmeler için yalnızca taşıma değil bütünsel bir operasyon yönetimi anlamına gelir.</p>",
      "Lojistik",
      "lojistik,nakliye,tedarik zinciri",
      "Lojistik, hayatın istisnasız her alanında yer alan son derece önemli bir unsurdur.",
      "6 dk",
      "30 Ağustos 2019",
      blogImage1,
      1,
      1,
    )
    await insertBlog.run(
      "lojistik-terimleri",
      "Lojistik Terimleri",
      "CMR, parsiyel, depolama, stok yönetimi ve uluslararası taşımacılıkta sık kullanılan temel kavramları bir araya getirdik.",
      "<p>Lojistik operasyonlarında kullanılan terimler; taşıma belgeleri, depolama kavramları ve uluslararası ticaret dokümanlarıyla birlikte geniş bir alan oluşturur.</p><p>CMR, FTL, LCL, parsiyel, depolama, stok kontrol ve tersine lojistik gibi kavramları bilmek operasyon süreçlerini doğru planlamak açısından kritik öneme sahiptir.</p><p>Doğru terminoloji; tekliflendirme, sevkiyat organizasyonu ve müşteri iletişimi gibi adımlarda hatasız ve hızlı süreç yönetimine yardımcı olur.</p>",
      "Terimler",
      "cmr,parsiyel,depolama,stok yönetimi",
      "Doğru terminoloji, operasyonun her adımında daha net ve hızlı karar alınmasını sağlar.",
      "9 dk",
      "26 Ağustos 2020",
      blogImage2,
      0,
      1,
    )
    await insertBlog.run(
      "uluslararasi-lojistik-ve-tasimacilik-nedir",
      "Uluslararası Lojistik ve Taşımacılık Nedir?",
      "Küresel ticaretin büyümesiyle birlikte uluslararası lojistik hizmetlerinin kapsamı ve önemi her geçen gün artmaktadır.",
      "<p>Uluslararası ticaretin artarak küreselleşmesi, kara-hava-deniz yolları ulaştırmasında ve şirketlere sağlanan lojistik hizmetlerinde artışa neden olmuştur.</p><p>Lojistik; müşterilerin ihtiyaçlarını karşılamak üzere ham maddenin başlangıç noktasından son tüketim noktasına kadar ürün ve bilgi akışının verimli olarak planlanması, yürütülmesi ve denetlenmesidir.</p><p>Başarılı uluslararası taşımacılık için planlama, belge yönetimi, rota organizasyonu ve nitelikli insan kaynağı bir bütün olarak ele alınmalıdır.</p>",
      "Uluslararası Taşımacılık",
      "uluslararası lojistik,taşımacılık,rota planlama",
      "Hizmet kalitesini ve operasyon standartlarını sürekli yüksek tutmak, uluslararası lojistiğin temel şartıdır.",
      "5 dk",
      "26 Ağustos 2020",
      blogImage3,
      0,
      1,
    )

    await db.prepare("DELETE FROM faq_items").run()
    await db.prepare("DELETE FROM faq_groups").run()
    const insertGroup = db.prepare("INSERT INTO faq_groups (category, sort_order) VALUES (?, ?)")
    const insertItem = db.prepare("INSERT INTO faq_items (group_id, question, answer, sort_order) VALUES (?, ?, ?, ?)")

    const fg1Res = await insertGroup.run("Hizmetlerimiz", 1)
    const fg1 = fg1Res.lastInsertRowid
    await insertItem.run(fg1, "Hangi taşıma hizmetlerini sunuyorsunuz?", "Frigolu taşıma, kara taşımacılığı, parsiyel taşıma, banka taşımacılığı, fuar taşıma ve tıbbi cihaz taşıma alanlarında hizmet veriyoruz.", 1)
    await insertItem.run(fg1, "Parsiyel ve komple yükleme yapıyor musunuz?", "Evet. Parsiyel ve komple yüklemeler için yük tipine ve rota planına göre uygun operasyon modeli oluşturuyoruz.", 2)
    await insertItem.run(fg1, "Kapıdan kapıya hizmet veriyor musunuz?", "Uygun operasyon modeline göre kapıdan kapıya hizmet ve teslimat planı sunabiliyoruz.", 3)

    const fg2Res = await insertGroup.run("Operasyon ve Teslim", 2)
    const fg2 = fg2Res.lastInsertRowid
    await insertItem.run(fg2, "Teslimat süreci nasıl planlanıyor?", "Yük tipi, rota, teslim penceresi ve araç uygunluğu birlikte değerlendirilerek sevkiyat planı oluşturuluyor.", 1)
    await insertItem.run(fg2, "Araç takibi yapabiliyor musunuz?", "Evet. Uydu üzerinden araç takibi ve süreç bilgilendirmesi ile sevkiyat görünürlüğü sağlıyoruz.", 2)
    await insertItem.run(fg2, "Hafta sonu hizmet veriyor musunuz?", "Evet. Hafta içi ve hafta sonu kesintisiz operasyon anlayışıyla hizmet sunuyoruz.", 3)

    const fg3Res = await insertGroup.run("Belgeler ve Güvenlik", 3)
    const fg3 = fg3Res.lastInsertRowid
    await insertItem.run(fg3, "Yetki belgeleriniz var mı?", "Taşımacılık sektöründe zorunlu olan belgelere sahibiz ve C2 eşya taşıma yetki belgesi ile hizmet veriyoruz.", 1)
    await insertItem.run(fg3, "Tıbbi cihaz ve hassas yükleri taşıyor musunuz?", "Evet. Hassas teknoloji ve medikal ekipmanlar için uygun sabitleme ve kontrollü yükleme ile özel operasyon yürütüyoruz.", 2)
    await insertItem.run(fg3, "Frigolu taşımada sıcaklık kontrollü hizmet sunuyor musunuz?", "Evet. Isı hassasiyeti olan ürünlerde frigolu araçlarla sıcaklık kontrollü sevkiyat sağlıyoruz.", 3)

    const fg4Res = await insertGroup.run("Teklif ve İletişim", 4)
    const fg4 = fg4Res.lastInsertRowid
    await insertItem.run(fg4, "Hızlı teklif almak için hangi bilgiler gerekli?", "Yük tipi, çıkış ve varış noktası, teslim tarihi ve temel yük bilgileri teklif hazırlamak için yeterlidir.", 1)
    await insertItem.run(fg4, "Merkez ofisiniz nerede?", "Merkez ofisimiz Ortahopa Mah. Küçükal Sit. A Blok Zemin Kat No:102 Hopa / Artvin adresindedir.", 2)
    await insertItem.run(fg4, "Depo adresiniz var mı?", "Evet. İzmit depomuz Uzunbey Mah. Bahçeli Sk. No:5 Uzun Çiftlik Kartepe / İzmit adresindedir.", 3)

    await db.prepare("DELETE FROM legal_pages").run()
    const insertLegal = db.prepare("INSERT INTO legal_pages (slug, title, content) VALUES (?, ?, ?)")
    await insertLegal.run("gizlilik", "Gizlilik Politikası", "# Gizlilik Politikası\n\nBu politika, iletişim ve teklif süreçlerinde tarafımıza iletilen bilgilerin nasıl işlendiğini açıklar.\n\n## Toplanan Veriler\n\nAd, telefon, e-posta, yük bilgileri ve mesaj içeriği işlenebilir.\n\n## Kullanım Amacı\n\nBu veriler yalnızca teklif sürecini yönetmek, operasyon planlamak ve sizinle iletişime geçmek amacıyla kullanılır.\n\n## İletişim\n\nSorularınız için iletişim sayfasındaki kanallar üzerinden bize ulaşabilirsiniz.")
    await insertLegal.run("kullanim-kosullari", "Kullanım Koşulları", "# Kullanım Koşulları\n\nBu web sitesini kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız.\n\n## İçerik\n\nSitedeki bilgiler genel bilgilendirme amaçlıdır. Nihai operasyon planı ve fiyat, teklif aşamasında netleşir.\n\n## Sorumluluk\n\nTeslim süreleri, rota ve operasyon koşulları yük tipi ile adres bilgilerine göre değişebilir.\n\n## Telif\n\nSitedeki tüm içerikler izinsiz kopyalanamaz.")
    await insertLegal.run("kvkk", "KVKK Aydınlatma Metni", "# KVKK Aydınlatma Metni\n\n6698 sayılı Kanun kapsamında, iletişim ve teklif sürecinde ilettiğiniz kişisel veriler işlenebilir.\n\n## Veri Sorumlusu\n\nGözde Nakliyat, teklif ve iletişim süreçlerini yürütmek amacıyla verilerinizi işleyebilir.\n\n## İşlenen Veriler\n\nAd-soyad, telefon, e-posta, yük bilgileri ve mesaj içeriği.\n\n## Amaç\n\nTeklif oluşturma, operasyon planlama ve iletişim süreçlerini yürütmek.\n\n## Haklarınız\n\nKVKK kapsamındaki erişim, düzeltme ve silme taleplerinizi iletişim kanallarımız üzerinden iletebilirsiniz.")

    await db.prepare(`
      UPDATE contact_page SET
        hero_eyebrow = ?, hero_title = ?, hero_lead = ?, hero_bg_image = ?,
        info_title = ?, info_lead = ?, form_title = ?, form_lead = ?,
        cta_title = ?, cta_lead = ?, cta_bg_image = ?, cta_primary_label = ?, cta_primary_url = ?,
        cta_secondary_label = ?, cta_secondary_url = ?
      WHERE id = 1
    `).run(
      "İletişim",
      "İletişim ve Hızlı Teklif",
      "Merkez ofis ve depo bilgilerimiz üzerinden bize ulaşabilir, hızlı teklif formu ile sevkiyat talebinizi iletebilirsiniz.",
      heroImage,
      "İletişim Bilgileri",
      "Merkez ofis: 0 466 351 32 10 / 11 / 12 / 41 · İzmit depo: Uzunbey Mah. Bahçeli Sk. No:5 Uzun Çiftlik Kartepe / İzmit",
      "Hızlı Teklif Talebi",
      "Frigolu, kara, parsiyel, banka, fuar veya tıbbi cihaz taşımalarınız için temel bilgileri paylaşın, size geri dönelim.",
      "Alternatif Ulaşım",
      "Form yerine telefon veya e-posta üzerinden de doğrudan ulaşabilirsiniz.",
      heroImage,
      "E-posta Gönder",
      "mailto:bilgi@gozdenakliyat.com.tr",
      "Telefon Et",
      "tel:+904663513210",
    )

    await db.prepare(`
      UPDATE blog_page SET
        hero_eyebrow = ?, hero_title = ?, hero_lead = ?, hero_bg_image = ?
      WHERE id = 1
    `).run(
      "Lojistik Yazıları",
      "Blog",
      "Lojistik, tedarik zinciri ve uluslararası taşımacılık başlıklarında şirketimizin paylaştığı temel içerikleri burada bulabilirsiniz.",
      heroImage,
    )

    await db.prepare(`
      UPDATE sss_page SET
        hero_eyebrow = ?, hero_title = ?, hero_lead = ?, hero_bg_image = ?,
        cta_title = ?, cta_lead = ?, cta_bg_image = ?, cta_primary_label = ?, cta_primary_url = ?,
        cta_secondary_label = ?, cta_secondary_url = ?
      WHERE id = 1
    `).run(
      "Merak Edilenler",
      "Sık Sorulan Sorular",
      "Frigolu, parsiyel, kara, banka, fuar ve tıbbi cihaz taşıma hizmetlerimiz hakkında en çok sorulan soruları burada bulabilirsiniz.",
      heroImage,
      "Cevabını bulamadığınız bir sorunuz mu var?",
      "Hızlı teklif veya operasyon detayları için bizimle doğrudan iletişime geçebilirsiniz.",
      heroImage,
      "İletişime Geçin",
      "/iletisim",
      "Hızlı Teklif İste",
      "/iletisim",
    )

    await db.prepare("DELETE FROM service_pages").run()
    const insertService = db.prepare(`
      INSERT INTO service_pages (
        slug, hero_eyebrow, hero_title, hero_lead, what_title, what_lead, benefits,
        issues_title, issues_lead, issues, process_title, process_lead, process_steps,
        cta_title, cta_lead, cta_bg_image, cta_primary_label, cta_primary_url, cta_secondary_label, cta_secondary_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    for (const service of services) {
      await insertService.run(
        service.slug,
        service.heroEyebrow,
        service.heroTitle,
        service.heroLead,
        service.whatTitle,
        service.whatLead,
        service.benefits,
        service.issuesTitle,
        service.issuesLead,
        service.issues,
        service.processTitle,
        service.processLead,
        service.processSteps,
        service.ctaTitle,
        service.ctaLead,
        heroImage,
        "Hızlı Teklif İste",
        "/iletisim",
        "Kurumsal",
        "/hakkimda",
      )
    }

    await db.prepare(`
      UPDATE services_page SET
        hero_eyebrow = ?, hero_title = ?, hero_lead = ?, hero_bg_image = ?,
        intro_title = ?, intro_lead = ?, cta_title = ?, cta_lead = ?, cta_bg_image = ?,
        cta_primary_label = ?, cta_primary_url = ?, cta_secondary_label = ?, cta_secondary_url = ?
      WHERE id = 1
    `).run(
      "Hizmetlerimiz",
      "Taşıma Çözümlerimiz",
      "Frigolu, kara, parsiyel, banka, fuar ve tıbbi cihaz taşımalarında yük tipine göre doğru operasyon modelini planlıyoruz.",
      heroImage,
      "Nasıl Yardımcı Olabiliriz?",
      "Yük tipi, teslim noktası ve termin bilgisine göre size uygun taşıma çözümünü oluşturuyoruz.",
      "Hızlı teklif almak ister misiniz?",
      "Sevkiyat detaylarınızı paylaşın, operasyon planınızı birlikte netleştirelim.",
      heroImage,
      "Hızlı Teklif İste",
      "/iletisim",
      "İletişime Geçin",
      "/iletisim",
    )

    await db.prepare(`
      UPDATE homepage SET
        hero_eyebrow = ?, hero_title = ?, hero_description = ?, hero_badge1 = ?, hero_badge2 = ?, hero_badge3 = ?,
        hero_bg_image = ?, hero_primary_label = ?, hero_primary_url = ?, hero_secondary_label = ?, hero_secondary_url = ?,
        accreditations = ?, about_eyebrow = ?, about_title = ?, about_role = ?, about_paragraph1 = ?, about_paragraph2 = ?, about_photo = ?,
        services_eyebrow = ?, services_title = ?, services_description = ?, services_bg_image = ?,
        process_eyebrow = ?, process_title = ?, process_description = ?, process_steps = ?,
        testimonials_eyebrow = ?, testimonials_title = ?, testimonials_description = ?,
        cta_title = ?, cta_description = ?, cta_bg_image = ?, cta_primary_label = ?, cta_primary_url = ?, cta_secondary_label = ?, cta_secondary_url = ?,
        services_items = ?
      WHERE id = 1
    `).run(
      "2000'den bu yana tercih edilen ilk isim",
      "Türkiye ve Avrupa genelinde güvenilir lojistik çözümleri",
      "Frigolu taşıma, kara taşımacılığı, parsiyel taşıma ve özel operasyonlarda yüklerinizi planlı, hızlı ve güvenli şekilde taşıyoruz.",
      "-26 C'ye kadar frigolu taşıma",
      "Parsiyel ve komple yüklemeler",
      "C2 yetki belgeli operasyon",
      heroImage,
      "Hızlı Teklif İste",
      "/iletisim",
      "Kurumsal",
      "/hakkimda",
      JSON.stringify([
        { icon: "snowflake", title: "-26 C'ye kadar frigolu taşıma", description: "Soğuk zincir için kontrollü operasyon" },
        { icon: "truck", title: "Parsiyel ve komple yüklemeler", description: "Yük tipine göre esnek sevkiyat modeli" },
        { icon: "shield", title: "C2 yetki belgeli operasyon", description: "Türkiye ve Avrupa genelinde planlı teslim" },
      ]),
      "Gözde Nakliyat",
      "20 yılı aşkın sektör deneyimi",
      "Frigolu, Kara, Parsiyel ve Özel Taşımacılık",
      "Nakliyat sektöründeki amacımız her zaman sektörün lider, tercih edilen ve müşteri memnuniyetini en üst düzeyde tutabilen firması olmaktır.",
      "Türkiye'nin tüm il ve ilçelerinde, ayrıca Avrupa hatlarında; ağır nakliyat, şehirler arası nakliyat, uluslararası sigortalı taşımacılık ve depolama hizmetleri sunuyoruz.",
      aboutImage,
      "Hizmetlerimiz",
      "Taşıma ihtiyaçlarınıza uygun çözümler",
      "Frigolu, kara, parsiyel, banka, fuar ve tıbbi cihaz taşımalarında yük tipine göre doğru operasyon modelini sunuyoruz.",
      aboutImage,
      "Nasıl Çalışıyoruz?",
      "Tekliften teslimata operasyon akışı",
      "Hızlı teklif, doğru araç planı, takip ve zamanında teslim odaklı çalışıyoruz.",
      JSON.stringify([
        { number: "1", title: "Teklif ve Planlama", description: "Yük tipi, teslim noktası ve termin bilgisi alınarak size uygun operasyon modeli oluşturulur." },
        { number: "2", title: "Araç ve Yükleme Organizasyonu", description: "Uygun araç filosu, uzman ekip ve yükleme düzeni operasyon öncesinde netleştirilir." },
        { number: "3", title: "Sevkiyat, Takip ve Teslim", description: "Araç takibi ve süreç bilgilendirmesi ile yükleriniz zamanında teslim edilir." },
      ]),
      "Kurumsal Güven",
      "Neden Gözde Nakliyat?",
      "Parsiyel ve komple yüklemelerden kapıdan kapıya teslimata kadar süreçlerimizi güven, hız ve planlama odağında yürütüyoruz.",
      "Hızlı teklif isteyin",
      "Parsiyel ve komple yüklemelerden tıbbi cihaz taşımasına kadar sevkiyat detaylarınızı paylaşın, size uygun çözümü hazırlayalım.",
      heroImage,
      "Hızlı Teklif İste",
      "/iletisim",
      "Frigolu Taşıma",
      "/frigolu-tasima",
      JSON.stringify(services.map((service) => ({
        slug: service.slug,
        title: service.heroTitle,
        description: service.heroLead,
        icon: resolveHomepageServiceIcon("", service.slug),
      }))),
    )
  })

  await tx()
}
