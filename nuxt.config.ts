import { defineNuxtConfig } from "nuxt/config"

export default defineNuxtConfig({
  compatibilityDate: "2025-03-01",
  devtools: { enabled: false },
  ssr: true,
  modules: ["@nuxtjs/seo"],
  css: ["~/assets/css/main.css"],
  seo: {
    // favicon admin panelden dinamik yönetiliyor (app.vue) — otomatik statik favicon taraması kapalı
    metaDataFiles: false
  },
  runtimeConfig: {
    turnstileSecret: process.env.TURNSTILE_SECRET_KEY || "",
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || "https://www.ev-mobil.com",
      turnstileSiteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY || ""
    }
  },
  app: {
    head: {
      htmlAttrs: {
        lang: "tr"
      },
      viewport: "width=device-width, initial-scale=1",
      titleTemplate: "%s | EV-mobil"
    }
  },
  // @ts-ignore - @nuxtjs/seo module augments this type at runtime
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || "https://www.ev-mobil.com",
    name: "EV-mobil",
    description: "Elektrikli araç şarj istasyonları için kurulum, devreye alma, bakım ve mobil şarj hizmetlerinde uzman ekibimizle yanınızdayız.",
    defaultLocale: "tr"
  },
  robots: {
    disallow: process.env.NODE_ENV === "production" ? [] : ["/"],
    sitemap: "/sitemap.xml"
  },
  sitemap: {
    autoLastmod: true,
    sources: ["/api/sitemap-urls"]
  },
  routeRules: {
    "/": { ssr: true },
    "/hakkimda": { ssr: true },
    "/iletisim": { ssr: true },
    "/sss": { ssr: true },
    "/gizlilik": { ssr: true },
    "/kullanim-kosullari": { ssr: true },
    "/kvkk": { ssr: true },
    "/admin/**": { ssr: false }
  },
  nitro: {
    prerender: {
      routes: ["/robots.txt"]
    }
  }
})
