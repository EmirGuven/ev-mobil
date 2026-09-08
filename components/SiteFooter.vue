<script setup lang="ts">
import { siteMeta, services as defaultServices } from "../data/site"
import {
  defaultFooterContactTitle,
  defaultFooterLegalLinks,
  defaultFooterMenuItems,
  defaultFooterMenuTitle,
  defaultFooterServicesTitle,
} from "../utils/site-settings"

const siteSettings = useState<any>("siteSettings")

const name = computed(() => siteSettings.value?.name || siteMeta.name)
const phone = computed(() => siteSettings.value?.phone || siteMeta.phone)
const phoneDisplay = computed(() => siteSettings.value?.phoneDisplay || siteSettings.value?.phone || siteMeta.phoneDisplay)
const email = computed(() => siteSettings.value?.email || siteMeta.email)
const street = computed(() => siteSettings.value?.address?.street || siteMeta.address.street)
const city = computed(() => siteSettings.value?.address?.city || siteMeta.address.city)
const workingHours = computed(() => siteSettings.value?.workingHours || siteMeta.workingHours)
const instagram = computed(() => siteSettings.value?.social?.[0] || siteMeta.social[0])
const linkedin = computed(() => siteSettings.value?.social?.[1] || siteMeta.social[1])
const logoTagline = computed(() => siteSettings.value?.logoTagline || "")
const footerTagline = computed(() => siteSettings.value?.footerTagline || "")
const logoType = computed(() => siteSettings.value?.logoType || "text")
const logoImage = computed(() => siteSettings.value?.logoImage || "")
const hasImageLogo = computed(() => logoType.value === "image" && !!logoImage.value)
const footerServicesTitle = computed(() => siteSettings.value?.footerServicesTitle || defaultFooterServicesTitle)
const footerMenuTitle = computed(() => siteSettings.value?.footerMenuTitle || defaultFooterMenuTitle)
const footerContactTitle = computed(() => siteSettings.value?.footerContactTitle || defaultFooterContactTitle)
const footerMenuItems = computed(() =>
  Array.isArray(siteSettings.value?.footerMenuItems) ? siteSettings.value.footerMenuItems : defaultFooterMenuItems
)
const footerLegalLinks = computed(() =>
  Array.isArray(siteSettings.value?.footerLegalLinks) ? siteSettings.value.footerLegalLinks : defaultFooterLegalLinks
)
const footerBottomText = computed(() =>
  siteSettings.value?.footerBottomText || `© ${new Date().getFullYear()} ${name.value}. Tüm hakları saklıdır.`
)

const { data: servicesData } = await useFetch("/api/services")
const serviceLinks = computed(() =>
  ((servicesData.value as any[])?.length ? (servicesData.value as any[]) : defaultServices).map((service: any) => ({
    slug: service.slug,
    title: service.title,
  }))
)
</script>

<template>
  <footer class="sf">
    <div class="sf__top">
      <div class="container sf__grid">
        <div class="sf__brand">
          <div class="sf__logo">
            <img
              v-if="hasImageLogo"
              :src="logoImage"
              :alt="name"
              class="sf__logo-image"
            >
            <template v-else>
              <div class="sf__logo-icon">
                <img src="/ev-mobil-mark-white.svg" alt="" class="sf__logo-glyph">
              </div>
              <div>
                <strong>{{ name }}</strong>
                <span v-if="logoTagline">{{ logoTagline }}</span>
              </div>
            </template>
          </div>
          <p v-if="footerTagline" class="sf__tagline">{{ footerTagline }}</p>
          <div class="sf__socials">
            <a v-if="instagram" :href="instagram" target="_blank" rel="noreferrer" aria-label="Instagram" class="sf__social">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
            </a>
            <a v-if="linkedin" :href="linkedin" target="_blank" rel="noreferrer" aria-label="LinkedIn" class="sf__social">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
            </a>
            <a :href="`mailto:${email}`" aria-label="E-posta" class="sf__social">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </a>
          </div>
        </div>

        <div class="sf__col">
          <h4 class="sf__col-title">{{ footerServicesTitle }}</h4>
          <nav class="sf__nav">
            <NuxtLink
              v-for="service in serviceLinks"
              :key="service.slug"
              :to="`/${service.slug}`"
            >{{ service.title }}</NuxtLink>
          </nav>
        </div>

        <div class="sf__col">
          <h4 class="sf__col-title">{{ footerMenuTitle }}</h4>
          <nav class="sf__nav">
            <AppSmartLink
              v-for="item in footerMenuItems"
              :key="`${item.label}-${item.to}`"
              :to="item.to"
            >
              {{ item.label }}
            </AppSmartLink>
          </nav>
        </div>

        <div class="sf__col">
          <h4 class="sf__col-title">{{ footerContactTitle }}</h4>
          <div class="sf__contact">
            <div class="sf__contact-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <span>{{ street }}, {{ city }}</span>
            </div>
            <a :href="`tel:${phone}`" class="sf__contact-item sf__contact-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.61 19a19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-2.93-8.18A2 2 0 0 1 4.68 2H7.7a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91A16 16 0 0 0 14 15.85l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <span>{{ phoneDisplay }}</span>
            </a>
            <a :href="`mailto:${email}`" class="sf__contact-item sf__contact-link">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              <span>{{ email }}</span>
            </a>
            <div class="sf__contact-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>{{ workingHours }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="sf__bottom">
      <div class="container sf__bottom-inner">
        <span>{{ footerBottomText }}</span>
        <div class="sf__legal">
          <AppSmartLink
            v-for="item in footerLegalLinks"
            :key="`${item.label}-${item.to}`"
            :to="item.to"
          >
            {{ item.label }}
          </AppSmartLink>
        </div>
      </div>
    </div>
  </footer>
</template>
