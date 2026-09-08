<script setup lang="ts">
import { usePageSeo } from "../composables/usePageSeo"
import { buildPageCtaBackgroundStyle } from "../utils/page-cta"
import { heroBadgeIconSvgMap, resolveHeroBadgeIcon } from "../utils/hero-badge-icons"

interface AboutData {
  heroEyebrow: string; heroTitle: string; heroLead: string; heroBgImage: string; photoUrl: string
  bioTitle: string; bioParagraphs: string[]
  bioBadgeValue: string; bioBadgeLabel: string
  specialties: { title: string; desc: string }[]
  heroBadges: { icon: string; title: string; description: string }[]
  timeline: { years: string; title: string; desc: string }[]
  approachTitle: string; approachLead: string
  approachValues: { title: string; desc: string }[]
  ctaTitle: string; ctaText: string; ctaBgImage: string
  ctaPrimaryLabel: string; ctaPrimaryUrl: string
  ctaSecondaryLabel: string; ctaSecondaryUrl: string
}

function resolveHeroBadgeSvg(icon?: string) {
  return heroBadgeIconSvgMap[resolveHeroBadgeIcon(icon)]
}

const { data: about } = await useFetch<AboutData>('/api/about')

usePageSeo({
  title: about.value?.heroTitle || "Kurumsal – Ev-Mobil",
  description: about.value?.heroLead || "Ev-Mobil'in hizmet yaklaşımı ve operasyon yapısı hakkında bilgi alın.",
  path: "/hakkimda"
})

const heroStyle = computed(() => about.value?.heroBgImage ? {
  backgroundImage: `linear-gradient(100deg, rgba(245,243,240,0.96) 24%, rgba(245,243,240,0.5) 45%, rgba(245,243,240,0.08) 80%), url(${about.value.heroBgImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center'
} : {})

const aboutCtaStyle = computed(() => buildPageCtaBackgroundStyle(about.value?.ctaBgImage))
</script>

<template>
  <div class="ab">

    <!-- ══════ HERO ══════ -->
    <section
      class="ab-hero"
      :style="heroStyle"
    >
      <div class="container ab-hero__inner">
        <div class="ab-hero__copy">
          <div v-if="about?.heroEyebrow" class="ab-hero__kicker">
            <span class="ab-hero__dot"></span>
            {{ about.heroEyebrow }}
          </div>
          <h1 class="ab-hero__h1">{{ about?.heroTitle || 'Hakkımızda' }}</h1>
          <p v-if="about?.heroLead" class="ab-hero__lead">{{ about.heroLead }}</p>
          <div class="ab-hero__actions">
            <a href="#egitim" class="ab-hero__btn-primary">Çalışma Modelimiz</a>
            <NuxtLink to="/iletisim" class="ab-hero__btn-sec">Randevu Alın →</NuxtLink>
          </div>
        </div>
      </div>

      <!-- Alt rozet bandı — admin'den -->
      <div v-if="about?.heroBadges?.length" class="ab-hero__feats">
        <div class="container ab-hero__feats-inner">
          <template v-for="(item, index) in about.heroBadges" :key="`${item.title}-${index}`">
            <div class="ab-hero__feat">
              <div class="ab-hero__feat-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" v-html="resolveHeroBadgeSvg(item.icon)" />
              </div>
              <div>
                <strong>{{ item.title }}</strong>
                <span v-if="item.description">{{ item.description }}</span>
              </div>
            </div>
            <div v-if="index < about.heroBadges.length - 1" class="ab-hero__feat-divider"></div>
          </template>
        </div>
      </div>
    </section>

    <!-- ══════ BİYOGRAFİ ══════ -->
    <section id="egitim" class="ab-section ab-section--light">
      <div class="container ab-bio">
        <div class="ab-bio__photo" v-if="about?.photoUrl">
          <img :src="about.photoUrl" :alt="about.heroTitle" />
          <div v-if="about?.bioBadgeValue" class="ab-bio__exp">
            <strong>{{ about.bioBadgeValue }}</strong>
            <span v-if="about.bioBadgeLabel">{{ about.bioBadgeLabel }}</span>
          </div>
        </div>
        <div class="ab-bio__copy">
          <span class="ab-tag">Kurumsal</span>
          <h2>{{ about?.bioTitle || 'Nasıl Çalışıyoruz?' }}</h2>
          <div class="ab-bio__paragraphs">
            <p v-for="(para, i) in about?.bioParagraphs" :key="i">{{ para }}</p>
          </div>
          <!-- Uzmanlık alanları -->
          <div v-if="about?.specialties?.length" class="ab-specs">
            <div v-for="(sp, i) in about.specialties" :key="i" class="ab-spec">
              <div class="ab-spec__icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 6 9 17l-5-5"/></svg>
              </div>
              <div>
                <strong>{{ sp.title }}</strong>
                <span>{{ sp.desc }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════ EĞİTİM TİMLİNE ══════ -->
    <section class="ab-section ab-section--warm">
      <div class="container">
        <div class="ab-section__head ab-section__head--center">
          <span class="ab-tag">Hikayemiz</span>
          <h2>Ev-Mobil'in Yolculuğu</h2>
        </div>
        <div class="ab-tl">
          <div v-for="(item, i) in about?.timeline" :key="i" class="ab-tl__item">
            <div class="ab-tl__aside">
              <div class="ab-tl__badge">{{ item.years }}</div>
              <div class="ab-tl__line" v-if="i < (about?.timeline?.length ?? 0) - 1"></div>
            </div>
            <div class="ab-tl__card">
              <div class="ab-tl__num">{{ String(i + 1).padStart(2, '0') }}</div>
              <div class="ab-tl__body">
                <h3>{{ item.title }}</h3>
                <p>{{ item.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════ TERAPÖTİK YAKLAŞIM ══════ -->
    <section class="ab-section ab-section--light">
      <div class="container">
        <div class="ab-section__head ab-section__head--center">
          <span class="ab-tag">Prensipler</span>
          <h2>{{ about?.approachTitle || 'Çalışma Prensiplerimiz' }}</h2>
          <p>{{ about?.approachLead }}</p>
        </div>
        <div class="ab-approach">
          <div v-for="(val, i) in about?.approachValues" :key="i" class="ab-approach__card">
            <div class="ab-approach__num">{{ String(i + 1).padStart(2, '0') }}</div>
            <div class="ab-approach__icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M20 6 9 17l-5-5"/></svg>
            </div>
            <h3>{{ val.title }}</h3>
            <p>{{ val.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ══════ CTA ══════ -->
    <section class="ab-cta" :style="aboutCtaStyle">
      <div class="container ab-cta__inner">
        <div class="ab-cta__copy">
          <h2 v-if="about?.ctaTitle">{{ about.ctaTitle }}</h2>
          <p v-if="about?.ctaText">{{ about.ctaText }}</p>
        </div>
        <div class="ab-cta__actions">
          <AppSmartLink :to="about?.ctaPrimaryUrl || '/iletisim'" class="ab-btn ab-btn--white">
            {{ about?.ctaPrimaryLabel || 'Randevu Al' }}
          </AppSmartLink>
          <AppSmartLink
            v-if="about?.ctaSecondaryLabel"
            :to="about?.ctaSecondaryUrl || '/sarj-istasyonu-kurulumu'"
            class="ab-btn ab-btn--ghost"
          >
            {{ about?.ctaSecondaryLabel || 'Hizmetleri İnceleyin' }}
          </AppSmartLink>
        </div>
      </div>
    </section>

  </div>
</template>
