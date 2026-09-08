<script setup lang="ts">
import { siteMeta } from "../data/site"
import {
  defaultHeaderCtaLabel,
  defaultHeaderCtaUrl,
  defaultHeaderMenuItems,
  isExternalLink,
} from "../utils/site-settings"
import { resolveHomepageServiceIcon, homepageServiceIconSvgMap } from "../utils/homepage-service-icons"

const isOpen = ref(false)
const scrolled = ref(false)
const route = useRoute()
const servicesOpen = ref(false)

const onScroll = () => {
  scrolled.value = window.scrollY > 30
}

function syncScrollLock(locked: boolean) {
  if (typeof document === "undefined") return
  document.documentElement.classList.toggle("is-locked", locked)
  document.body.classList.toggle("is-locked", locked)
}

function isRouteActive(url: string) {
  if (!url || isExternalLink(url)) return false
  return route.path === url
}

onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true })
  onScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener("scroll", onScroll)
  syncScrollLock(false)
})

watch(() => route.path, () => {
  isOpen.value = false
  servicesOpen.value = false
})

watch(isOpen, (open) => {
  syncScrollLock(open)
})

const siteSettings = useState<any>("siteSettings")
const brandName = computed(() => siteSettings.value?.name || siteMeta.name)
const logoTagline = computed(() => siteSettings.value?.logoTagline || "")
const titleParts = computed(() => {
  const value = brandName.value
  const splitIndex = value.lastIndexOf(" ")
  return splitIndex > 0 ? [value.slice(0, splitIndex), value.slice(splitIndex + 1)] : [value, ""]
})
const logoType = computed(() => siteSettings.value?.logoType || "text")
const logoImage = computed(() => siteSettings.value?.logoImage || "")
const hasImageLogo = computed(() => logoType.value === "image" && !!logoImage.value)
const phone = computed(() => siteSettings.value?.phone || siteMeta.phone)
const phoneDisplay = computed(() => siteSettings.value?.phoneDisplay || phone.value)
const instagram = computed(() => siteSettings.value?.social?.[0] || siteMeta.social[0])
const linkedin = computed(() => siteSettings.value?.social?.[1] || siteMeta.social[1])
const headerCtaLabel = computed(() => siteSettings.value?.headerCtaLabel || defaultHeaderCtaLabel)
const headerCtaUrl = computed(() => siteSettings.value?.headerCtaUrl || defaultHeaderCtaUrl)
const headerMenuItems = computed(() =>
  Array.isArray(siteSettings.value?.headerMenuItems) ? siteSettings.value.headerMenuItems : defaultHeaderMenuItems
)

const { data: servicesData } = await useFetch("/api/services")
const servicesItems = computed(() => (servicesData.value as any[]) || [])
const servicesMenuActive = computed(() =>
  servicesOpen.value || servicesItems.value.some((svc) => route.path === `/${svc.slug}`)
)

function getServiceIconSvg(svc: any): string {
  const iconId = resolveHomepageServiceIcon(svc.icon, svc.slug)
  return homepageServiceIconSvgMap[iconId] ?? ""
}

function truncate(text: string, max = 50): string {
  if (!text) return ""
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text
}
</script>

<template>
  <header class="nh" :class="{ 'nh--stuck': scrolled }">
    <div class="nh__bar">
      <div class="nh__inner">
        <NuxtLink to="/" class="nh__logo">
          <img
            v-if="hasImageLogo"
            :src="logoImage"
            :alt="brandName"
            class="nh__logo-image"
          >
          <template v-else>
            <div class="nh__logo-icon">
              <img src="/ev-mobil-mark-white.svg" alt="" class="nh__logo-glyph">
            </div>
            <div class="nh__logo-text">
              <span class="nh__logo-name">
                <em>{{ titleParts[0] }}</em>
                <strong v-if="titleParts[1]">{{ titleParts[1] }}</strong>
              </span>
              <span v-if="logoTagline" class="nh__logo-sub">{{ logoTagline }}</span>
            </div>
          </template>
        </NuxtLink>

        <nav class="nh__nav" aria-label="Ana Navigasyon">
          <template v-for="item in headerMenuItems" :key="`${item.type}-${item.label}-${item.to}`">
            <div
              v-if="item.type === 'services'"
              class="nh__dropdown"
              @mouseenter="servicesOpen = true"
              @mouseleave="servicesOpen = false"
            >
              <button class="nh__nav-link nh__nav-link--dropdown" :class="{ 'nh__nav-link--active': servicesMenuActive }">
                {{ item.label }}
                <svg width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <Transition name="nh-dropdown">
                <div v-if="servicesOpen" class="nh__dropdown-menu">
                  <div class="nh__dropdown-grid">
                    <NuxtLink
                      v-for="svc in servicesItems"
                      :key="svc.slug"
                      :to="`/${svc.slug}`"
                      class="nh__dropdown-item"
                    >
                      <span class="nh__dropdown-icon">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" v-html="getServiceIconSvg(svc)" />
                      </span>
                      <span class="nh__dropdown-body">
                        <span class="nh__dropdown-title">{{ svc.title?.slice(0, 50) }}</span>
                        <span v-if="svc.description" class="nh__dropdown-subdesc">{{ svc.description?.slice(0, 50) }}{{ svc.description?.length > 50 ? '…' : '' }}</span>
                        <span class="nh__dropdown-desc">Detaya git →</span>
                      </span>
                    </NuxtLink>
                  </div>
                </div>
              </Transition>
            </div>

            <AppSmartLink
              v-else
              :to="item.to"
              class="nh__nav-link"
              :class="{ 'nh__nav-link--active': isRouteActive(item.to) }"
            >
              {{ item.label }}
            </AppSmartLink>
          </template>
        </nav>

        <div class="nh__actions">
          <AppSmartLink
            :to="headerCtaUrl"
            class="nh__cta"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {{ headerCtaLabel }}
          </AppSmartLink>
          <button class="nh__burger" @click="isOpen = !isOpen" :aria-expanded="isOpen" aria-label="Menü">
            <span class="nh__burger-line" :class="{ 'nh__burger-line--top-open': isOpen }"></span>
            <span class="nh__burger-line" :class="{ 'nh__burger-line--mid-open': isOpen }"></span>
            <span class="nh__burger-line" :class="{ 'nh__burger-line--bot-open': isOpen }"></span>
          </button>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="nh-panel">
        <div v-if="isOpen" class="nh__overlay" @click.self="isOpen = false">
          <div class="nh__panel">
            <div class="nh__panel-head">
              <span class="nh__panel-title">Menü</span>
              <button class="nh__panel-close" @click="isOpen = false" aria-label="Kapat">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <nav class="nh__panel-nav">
              <template v-for="item in headerMenuItems" :key="`mobile-${item.type}-${item.label}-${item.to}`">
                <div v-if="item.type === 'services'" class="nh__panel-submenu">
                  <button class="nh__panel-link" @click="servicesOpen = !servicesOpen" :aria-expanded="servicesOpen">
                    <span>{{ item.label }}</span>
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" :style="{ transform: servicesOpen ? 'rotate(180deg)' : 'rotate(0)' }"><path d="m6 9 6 6 6-6"/></svg>
                  </button>
                  <Transition name="nh-collapse">
                    <div v-if="servicesOpen" class="nh__panel-submenu-items">
                      <NuxtLink
                        v-for="svc in servicesItems"
                        :key="svc.slug"
                        :to="`/${svc.slug}`"
                        class="nh__panel-submenu-item"
                      >
                        {{ svc.title }}
                      </NuxtLink>
                    </div>
                  </Transition>
                </div>

                <AppSmartLink
                  v-else
                  :to="item.to"
                  class="nh__panel-link"
                >
                  <span>{{ item.label }}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </AppSmartLink>
              </template>
            </nav>
            <div class="nh__panel-foot">
              <AppSmartLink
                :to="headerCtaUrl"
                class="nh__cta nh__cta--full"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {{ headerCtaLabel }}
              </AppSmartLink>
              <a :href="`tel:${phone}`" class="nh__panel-tel">{{ phoneDisplay }}</a>
              <div class="nh__panel-socials">
                <a v-if="instagram" :href="instagram" target="_blank" rel="noreferrer">Instagram</a>
                <a v-if="linkedin" :href="linkedin" target="_blank" rel="noreferrer">LinkedIn</a>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </header>
</template>
