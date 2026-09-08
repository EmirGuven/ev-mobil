<script setup lang="ts">
import { siteMeta } from "./data/site"
import { useHead, useSeoMeta } from "@unhead/vue"
import { useSchemaOrg } from "@unhead/schema-org/vue"
import { buildCustomThemeColors, defaultThemePaletteId, resolveThemePalette } from "./utils/theme-palettes"

// Canlı site ayarlarını yükle ve global state'e koy
const { data: apiSettings } = await useFetch('/api/settings')
const siteSettings = useState('siteSettings', () => apiSettings.value)
watch(apiSettings, (v) => { if (v) siteSettings.value = v })

const themePaletteId = computed(() => (siteSettings.value as any)?.themePalette || defaultThemePaletteId)
const activeThemeColors = computed(() => {
  const settings = (siteSettings.value as any) || {}
  if (settings.customThemeEnabled) {
    return buildCustomThemeColors({
      primary: settings.customTheme?.primary,
      primaryDeep: settings.customTheme?.primaryDeep,
      surfaceDark: settings.customTheme?.surfaceDark,
      accentContrast: settings.customTheme?.accentContrast,
    })
  }

  return resolveThemePalette(themePaletteId.value).colors
})

const themeInlineVars = computed(() => {
  const palette = activeThemeColors.value
  return [
    `--primary:${palette.primary}`,
    `--primary-mid:${palette.primaryMid}`,
    `--primary-light:${palette.primaryLight}`,
    `--primary-deep:${palette.primaryDeep}`,
    `--primary-soft:${palette.primarySoft}`,
    `--primary-soft-mid:${palette.primarySoftMid}`,
    `--gold:${palette.gold}`,
    `--gold-light:${palette.goldLight}`,
    `--gold-soft:${palette.goldSoft}`,
    `--surface-dark:${palette.surfaceDark}`,
    `--accent-contrast:${palette.accentContrast}`,
  ].join(";")
})

useSeoMeta(() => ({
  robots: "index, follow",
  author: (siteSettings.value as any)?.name || siteMeta.name,
  ogSiteName: (siteSettings.value as any)?.name || siteMeta.name,
  twitterCard: "summary_large_image",
  themeColor: "#ffffff",
}))

const faviconHref = computed(() => (siteSettings.value as any)?.favicon || "/favicon.svg")
const faviconType = computed(() => {
  const href = faviconHref.value
  if (href.endsWith(".png")) return "image/png"
  if (href.endsWith(".svg")) return "image/svg+xml"
  return "image/x-icon"
})

useHead(() => ({
  htmlAttrs: {
    class: `theme-palette-${themePaletteId.value}`,
    style: themeInlineVars.value,
  },
  bodyAttrs: {
    class: "site-body"
  },
  link: [
    { rel: "icon", type: faviconType.value, href: faviconHref.value },
  ],
}))

useSchemaOrg([
  {
    "@type": "WebSite",
    name: siteMeta.name,
    description: siteMeta.description,
    url: siteMeta.url,
    inLanguage: "tr-TR"
  },
  {
    "@type": "MovingCompany",
    name: siteMeta.name,
    description: siteMeta.description,
    url: siteMeta.url,
    telephone: siteMeta.phone,
    email: siteMeta.email,
    image: siteMeta.ogImage,
    priceRange: "$$",
    areaServed: "Istanbul",
    address: {
      "@type": "PostalAddress",
      streetAddress: siteMeta.address.street,
      addressLocality: siteMeta.address.city,
      addressRegion: siteMeta.address.region,
      postalCode: siteMeta.address.postalCode,
      addressCountry: "TR"
    }
  }
])
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
