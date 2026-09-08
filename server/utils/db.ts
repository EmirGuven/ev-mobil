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
      name TEXT NOT NULL DEFAULT 'Ev-Mobil',
      title_suffix TEXT NOT NULL DEFAULT 'Ev-Mobil',
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
      bio_title TEXT NOT NULL DEFAULT 'Ev-Mobil',
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
      testimonials_title TEXT NOT NULL DEFAULT 'Neden Ev-Mobil?',
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
      "Ev-Mobil",
      "Ev-Mobil",
      "Ev-Mobil; frigolu taşıma, kara taşımacılığı, parsiyel taşıma, banka taşımacılığı, fuar taşıma ve tıbbi cihaz taşıma alanlarında Türkiye ve Avrupa genelinde hizmet sunar.",
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
      "Ev-Mobil",
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
      "Neden Ev-Mobil?",
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
}
