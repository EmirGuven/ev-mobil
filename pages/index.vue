<script setup lang="ts">
import { siteMeta } from "../data/site"
import { usePageSeo } from "../composables/usePageSeo"
import { buildPageCtaBackgroundStyle } from "../utils/page-cta"
import {
  homepageServiceIconSvgMap,
  resolveHomepageServiceIcon,
} from "../utils/homepage-service-icons"

usePageSeo({
  title: "Ev-Mobil | İşitme Testi ve İşitme Cihazları",
  description:
    "Ev-Mobil ile işitme testi, işitme cihazı uygulama ve ayarlama, kulak kalıbı ve teknik destek hizmetlerinden yararlanın.",
  path: "/"
})

const { data: hp } = await useFetch('/api/homepage')
const h = computed(() => (hp.value as any) || {})

const hero             = computed(() => h.value.hero            || {})
const about            = computed(() => h.value.about           || {})
const servicesHead     = computed(() => h.value.services        || {})
const processData      = computed<{ eyebrow?: string; title?: string; description?: string; steps?: { number: string; title: string; description: string }[] }>(() => h.value.process || {})
const cta              = computed(() => h.value.cta             || {})
const accreditations   = computed(() => h.value.accreditations  || [])
const servicesItems    = computed(() => h.value.servicesItems   || [])
const servicesSectionStyle = computed(() => {
  const image = servicesHead.value.bgImage
  if (!image) return {}

  return {
    backgroundImage: `linear-gradient(180deg, rgba(5,7,10,0.3) 0%, rgba(5,7,10,0.36) 54%, rgba(5,7,10,0.42) 100%), linear-gradient(90deg, rgba(5,7,10,0.12) 0%, rgba(5,7,10,0.2) 100%), url(${image})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  }
})

const heroFeatureIconMap: Record<string, string> = {
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>',
  ear: '<path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0"/><path d="M15 8.5a2.5 2.5 0 0 0-5 0v1a2 2 0 1 1 0 4"/>',
  device: '<path d="M4 10v4"/><path d="M8 6v12"/><path d="M12 3v18"/><path d="M16 6v12"/><path d="M20 10v4"/>',
  tune: '<line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/>',
}

// Hero rozetleri (yalnızca admin'de girilenler gösterilir)
const heroBadges = computed(() => {
  const badges = []
  if (hero.value.badge1) badges.push(hero.value.badge1)
  if (hero.value.badge2) badges.push(hero.value.badge2)
  if (hero.value.badge3) badges.push(hero.value.badge3)
  return badges
})

const heroFeatures = computed(() => {
  const items = Array.isArray(accreditations.value) ? accreditations.value : []
  return items
    .map((item: any) => ({
      icon: item?.icon || 'shield',
      title: item?.title || item?.label || '',
      description: item?.description || item?.text || '',
    }))
    .filter((item) => item.title)
})

const heroBackgroundImage = computed(() => hero.value.bgImage || siteMeta.ogImage)
const heroImages = computed(() => {
  const images = Array.isArray(hero.value.images)
    ? hero.value.images.map((image: any) => String(image || '').trim()).filter(Boolean)
    : []

  return images.length ? images : [heroBackgroundImage.value]
})
const activeHeroImageIndex = ref(0)
const activeHeroImage = computed(() => heroImages.value[activeHeroImageIndex.value] || heroBackgroundImage.value)
let heroImageTimer: ReturnType<typeof window.setInterval> | undefined

watch(heroImages, (images) => {
  if (activeHeroImageIndex.value >= images.length) activeHeroImageIndex.value = 0
})

onMounted(() => {
  heroImageTimer = window.setInterval(() => {
    if (heroImages.value.length > 1) {
      activeHeroImageIndex.value = (activeHeroImageIndex.value + 1) % heroImages.value.length
    }
  }, 6000)
})

onBeforeUnmount(() => {
  if (heroImageTimer) window.clearInterval(heroImageTimer)
})
const heroPrimaryLabel = computed(() => hero.value.primaryLabel || 'Randevu Al')
const heroPrimaryUrl = computed(() => hero.value.primaryUrl || '/iletisim')
const heroSecondaryLabel = computed(() => hero.value.secondaryLabel === '' ? '' : (hero.value.secondaryLabel || 'Kurumsal'))
const heroSecondaryUrl = computed(() => hero.value.secondaryUrl || '/hakkimda')

const { data: blogData } = await useFetch('/api/blog')
const recentPosts = computed(() => ((blogData.value as any) || []).slice(0, 3))

const heroStyle = computed(() => ({
  backgroundImage: `linear-gradient(100deg, rgba(245,243,240,0.97) 30%, rgba(245,243,240,0.6) 55%, rgba(245,243,240,0.05) 100%), url(${activeHeroImage.value})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center top'
}))

const homepageCtaStyle = computed(() => {
  return buildPageCtaBackgroundStyle(cta.value.bgImage)
})

function resolveHeroFeatureIcon(icon?: string) {
  return heroFeatureIconMap[icon || 'shield'] || heroFeatureIconMap.shield
}

function resolveHomepageServiceSvg(icon?: string, slug?: string) {
  const key = resolveHomepageServiceIcon(icon, slug)
  return homepageServiceIconSvgMap[key]
}
</script>

<template>
  <div class="hp">

    <!-- ═══════ 1. HERO ═══════ -->
    <section
      class="hp-hero"
      :style="heroStyle"
    >
      <div class="container hp-hero__inner">
        <div class="hp-hero__copy">
          <div v-if="hero.eyebrow" class="hp-hero__kicker">
            <span class="hp-hero__dot"></span>
            {{ hero.eyebrow }}
          </div>
          <h1 v-if="hero.title" class="hp-hero__h1">
            {{ hero.title }}
          </h1>
          <p v-if="hero.description" class="hp-hero__desc">
            {{ hero.description }}
          </p>

          <div class="hp-hero__actions">
            <NuxtLink :to="heroPrimaryUrl" class="hp-hero__btn-primary">
              {{ heroPrimaryLabel }}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </NuxtLink>
            <NuxtLink v-if="heroSecondaryLabel" :to="heroSecondaryUrl" class="hp-hero__btn-sec">{{ heroSecondaryLabel }} →</NuxtLink>
          </div>

          <StoryBar title="Keşfet" />

          <div v-if="heroBadges.length" class="hp-hero__badges">
            <span v-for="badge in heroBadges" :key="badge" class="hp-hero__badge">
              {{ badge }}
            </span>
          </div>
        </div>
      </div>

      <!-- Alt güven şeridi -->
      <div v-if="heroFeatures.length" class="hp-hero__feats">
        <div class="container hp-hero__feats-inner">
          <template v-for="(item, index) in heroFeatures" :key="`${item.title}-${index}`">
            <div class="hp-hero__feat">
              <div class="hp-hero__feat-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" v-html="resolveHeroFeatureIcon(item.icon)" />
              </div>
              <div>
                <strong>{{ item.title }}</strong>
                <span v-if="item.description">{{ item.description }}</span>
              </div>
            </div>
            <div v-if="index < heroFeatures.length - 1" class="hp-hero__feat-divider"></div>
          </template>
        </div>
      </div>
    </section>

    <!-- ═══════ 3. HİZMETLER — admin'den ═══════ -->
    <section id="hizmetler" class="hp-section hp-section--svc" :style="servicesSectionStyle">
      <div class="container">
        <div class="hp-section__head hp-section__head--center">
          <div>
            <span class="hp-tag hp-tag--light">{{ servicesHead.eyebrow || 'Hizmetler' }}</span>
            <h2>{{ servicesHead.title || 'Hangi İşitme Hizmetlerini Sunuyoruz?' }}</h2>
            <p v-if="servicesHead.description">{{ servicesHead.description }}</p>
          </div>
        </div>

        <div class="hp-services">
          <NuxtLink
            v-for="(svc, idx) in servicesItems"
            :key="svc.slug || svc.title"
            :to="`/${svc.slug || 'hizmet'}`"
            class="hp-svc"
          >
            <span class="hp-svc__num">{{ String(Number(idx) + 1).padStart(2, '0') }}</span>
            <div class="hp-svc__icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" v-html="resolveHomepageServiceSvg(svc.icon, svc.slug)" />
            </div>
            <h3>{{ svc.title }}</h3>
            <p>{{ svc.description }}</p>
            <span class="hp-svc__arrow">
              Detaylar
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </span>
          </NuxtLink>
        </div>
      </div>
    </section>

    

    <!-- ═══════ 4. HAKKIMDA — admin'den (paragraph1 + paragraph2 + photo) ═══════ -->
    <section class="hp-section hp-section--alt">
      <div class="container hp-about">
        <div class="hp-about__photo">
          <img :src="about.photo || heroBackgroundImage" :alt="about.title || 'Ev-Mobil'" />
        </div>
        <div class="hp-about__copy">
          <span v-if="about.eyebrow" class="hp-tag">{{ about.eyebrow }}</span>
          <h2 v-if="about.title">{{ about.title }}</h2>
          <p v-if="about.role" class="hp-about__role">{{ about.role }}</p>
          <p v-if="about.paragraph1">{{ about.paragraph1 }}</p>
          <p v-if="about.paragraph2">{{ about.paragraph2 }}</p>
          <div class="hp-btnrow">
            <NuxtLink to="/hakkimda" class="hp-btn hp-btn--outline">Kurumsal Bilgi</NuxtLink>
            <NuxtLink to="/iletisim" class="hp-btn hp-btn--gold">Randevu Al</NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ 5. SÜREÇ ADIMLARI — admin'den ═══════ -->
    <section v-if="processData.steps && processData.steps.length" class="hp-section hp-section--dark">
      <div class="container">
        <div class="hp-section__head hp-section__head--center">
          <span class="hp-tag hp-tag--light">{{ processData.eyebrow || 'Süreç' }}</span>
          <h2>{{ processData.title }}</h2>
          <p v-if="processData.description">{{ processData.description }}</p>
        </div>
        <div class="hp-steps">
          <div v-for="(step, i) in processData.steps" :key="i" class="hp-step">
            <div class="hp-step__num">{{ step.number || String(i + 1) }}</div>
            <h3>{{ step.title }}</h3>
            <p>{{ step.description }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══════ 7. BLOG ÖNİZLEME — admin'den ═══════ -->
    <section v-if="recentPosts.length" class="hp-section hp-section--alt">
      <div class="container">
        <div class="hp-section__head">
          <div>
            <span class="hp-tag">Blog</span>
            <h2>Son Yazılar</h2>
          </div>
          <NuxtLink to="/blog" class="hp-link">Tümünü Gör →</NuxtLink>
        </div>
        <div class="hp-blog">
          <NuxtLink
            v-for="post in recentPosts"
            :key="post.slug"
            :to="`/blog/${post.slug}`"
            class="hp-post"
          >
            <!-- Numara + görsel yan yana üst kısım -->
            <div class="hp-post__top">
              <div class="hp-post__img">
                <img v-if="post.image" :src="post.image" :alt="post.title" />
                <div v-else class="hp-post__placeholder" />
              </div>
              <span v-if="post.category" class="hp-post__cat">{{ post.category }}</span>
            </div>
            <div class="hp-post__body">
              <h3>{{ post.title }}</h3>
              <p>{{ post.excerpt }}</p>
              <div class="hp-post__meta">
                <span class="hp-post__date">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  {{ post.date }}
                </span>
                <span class="hp-post__read">
                  Devamını Oku
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ═══════ 8. CTA BANT — admin'den ═══════ -->
    <section class="hp-cta" :style="homepageCtaStyle">
      <div class="container hp-cta__inner">
        <div class="hp-cta__copy">
          <h2 v-if="cta.title">{{ cta.title }}</h2>
          <p v-if="cta.description">{{ cta.description }}</p>
        </div>
        <div class="hp-btnrow">
          <AppSmartLink :to="cta.primaryUrl || '/iletisim'" class="hp-btn hp-btn--white">
            {{ cta.primaryLabel || 'Randevu Al' }}
          </AppSmartLink>
          <AppSmartLink
            v-if="cta.secondaryLabel"
            :to="cta.secondaryUrl || '/blog'"
            class="hp-btn hp-btn--ghost-light"
          >
            {{ cta.secondaryLabel }}
          </AppSmartLink>
        </div>
      </div>
    </section>

  </div>
</template>
