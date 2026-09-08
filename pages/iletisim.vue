<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount } from "vue"
import { siteMeta, services as defaultServices } from "../data/site"
import { usePageSeo } from "../composables/usePageSeo"
import { buildPageCtaBackgroundStyle } from "../utils/page-cta"

interface ContactData {
  heroEyebrow: string; heroTitle: string; heroLead: string; heroBgImage: string
  infoTitle: string; infoLead: string
  formTitle: string; formLead: string
  ctaTitle: string; ctaLead: string; ctaBgImage: string
  ctaPrimaryLabel: string; ctaPrimaryUrl: string
  ctaSecondaryLabel: string; ctaSecondaryUrl: string
  email: string
}

const { data: contact } = await useFetch<ContactData>('/api/contact')

usePageSeo({
  title: "İletişim ve Teklif Talebi – EV-mobil",
  description: contact.value?.heroLead || "Elektrikli araç şarj istasyonu kurulumu, bakımı ve mobil şarj talepleriniz için EV-mobil iletişim ve teklif sayfası.",
  path: "/iletisim"
})

// Canlı site ayarları
const s = useState<any>('siteSettings')
const phone        = computed(() => s.value?.phone        || siteMeta.phone)
const phoneDisplay = computed(() => s.value?.phoneDisplay || s.value?.phone || siteMeta.phoneDisplay)
const email        = computed(() => contact.value?.email || s.value?.email || siteMeta.email)
const mapsUrl      = computed(() => s.value?.mapsUrl      || siteMeta.mapsUrl)
const workingHours = computed(() => s.value?.workingHours || siteMeta.workingHours)
const street       = computed(() => s.value?.address?.street || siteMeta.address.street)
const region       = computed(() => s.value?.address?.region || siteMeta.address.region)
const city         = computed(() => s.value?.address?.city   || siteMeta.address.city)
const instagram    = computed(() => s.value?.social?.[0]     || siteMeta.social[0])
const linkedin     = computed(() => s.value?.social?.[1]     || siteMeta.social[1])
const { data: servicesData } = await useFetch('/api/services')
const serviceOptions = computed(() =>
  ((servicesData.value as any[])?.length ? (servicesData.value as any[]) : defaultServices).map((service: any) => ({
    slug: service.slug,
    title: service.title,
  }))
)

const contactCtaStyle = computed(() => buildPageCtaBackgroundStyle(contact.value?.ctaBgImage))
const mapsEmbedUrl = computed(() =>
  `https://www.google.com/maps?q=${encodeURIComponent(`${street.value} ${region.value} ${city.value}`)}&output=embed`
)

const runtimeConfig = useRuntimeConfig()
const turnstileSiteKey = String(runtimeConfig.public.turnstileSiteKey || "")
const turnstileEnabled = computed(() => Boolean(turnstileSiteKey))
const turnstileToken = ref("")

if (turnstileEnabled.value) {
  useHead({
    script: [
      {
        src: "https://challenges.cloudflare.com/turnstile/v0/api.js",
        async: true,
        defer: true,
      },
    ],
  })
}

onMounted(() => {
  if (!turnstileEnabled.value || !process.client) return
  ;(window as any).onTurnstileSuccess = (token: string) => {
    turnstileToken.value = token
  }
  ;(window as any).onTurnstileExpired = () => {
    turnstileToken.value = ""
  }
})

onBeforeUnmount(() => {
  if (!process.client) return
  if ((window as any).onTurnstileSuccess) delete (window as any).onTurnstileSuccess
  if ((window as any).onTurnstileExpired) delete (window as any).onTurnstileExpired
})

const form = reactive({
  name: "",
  phone: "",
  email: "",
  service: "",
  message: "",
  website: "",
  form_started_at: Date.now()
})

const submitted = ref(false)
const submitting = ref(false)
const submitError = ref('')

async function handleSubmit() {
  submitting.value = true
  submitError.value = ''

  if (turnstileEnabled.value && !turnstileToken.value) {
    submitting.value = false
    submitError.value = 'Lütfen güvenlik doğrulamasını tamamlayın.'
    return
  }

  try {
    await $fetch('/api/appointments', {
      method: 'POST',
      body: {
        name: form.name,
        phone: form.phone,
        email: form.email,
        service: form.service,
        message: form.message,
        website: form.website,
        form_started_at: form.form_started_at,
        turnstile_token: turnstileToken.value,
      },
    })
    submitted.value = true
  } catch (err: any) {
    submitError.value = err?.data?.message || 'Bir hata oluştu. Lütfen tekrar deneyiniz.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div>
    <!-- HERO -->
    <section class="hakkimda-hero">
      <img
        v-if="contact?.heroBgImage"
        :src="contact.heroBgImage"
        alt=""
        class="hakkimda-hero__bg"
        aria-hidden="true"
      />
      <div class="hakkimda-hero__overlay" />
      <div class="container hakkimda-hero__content">
        <p class="eyebrow">{{ contact?.heroEyebrow }}</p>
        <div class="section-divider" />
        <h1>{{ contact?.heroTitle }}</h1>
        <p class="page__lead">{{ contact?.heroLead }}</p>
      </div>
    </section>

    <!-- CONTACT GRID -->
    <section class="section section--muted">
      <div class="container contact-grid">
        <!-- Sol: Bilgi -->
        <div class="contact-info-card">
          <h2>{{ contact?.infoTitle }}</h2>
          <p>{{ contact?.infoLead }}</p>

          <ul class="contact-info-list">
            <li class="contact-info-item">
              <span class="contact-info-item__icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </span>
              <div class="contact-info-item__body">
                <strong>Adres</strong>
                <a :href="mapsUrl" target="_blank" rel="noreferrer">{{ street }}, {{ region }}, {{ city }}</a>
              </div>
            </li>
            <li class="contact-info-item">
              <span class="contact-info-item__icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l1.84-1.84a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              </span>
              <div class="contact-info-item__body">
                <strong>Telefon</strong>
                <a :href="`tel:${phone}`">{{ phoneDisplay }}</a>
              </div>
            </li>
            <li class="contact-info-item">
              <span class="contact-info-item__icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </span>
              <div class="contact-info-item__body">
                <strong>E-posta</strong>
                <a :href="`mailto:${email}`">{{ email }}</a>
              </div>
            </li>
            <li class="contact-info-item">
              <span class="contact-info-item__icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </span>
              <div class="contact-info-item__body">
                <strong>Çalışma Saatleri</strong>
                <span>{{ workingHours }}</span>
              </div>
            </li>
          </ul>

          <div class="contact-info-social">
            <p class="contact-info-social__label">Sosyal medyada bizi takip edin</p>
            <div class="contact-info-social__actions">
              <a
                :href="instagram"
                target="_blank"
                rel="noreferrer"
                class="button button--secondary button--small"
              >Instagram</a>
              <a
                :href="linkedin"
                target="_blank"
                rel="noreferrer"
                class="button button--secondary button--small"
              >LinkedIn</a>
            </div>
          </div>
        </div>

        <!-- Sağ: Form -->
        <div class="contact-form-card">
          <div v-if="!submitted">
            <h2>{{ contact?.formTitle }}</h2>
            <p>{{ contact?.formLead }}</p>

            <form @submit.prevent="handleSubmit">
              <input
                v-model="form.website"
                type="text"
                tabindex="-1"
                autocomplete="off"
                aria-hidden="true"
                style="position:absolute;left:-99999px;opacity:0;width:1px;height:1px;pointer-events:none"
              >

              <div class="form-row">
                <div class="form-group">
                  <label for="name">Ad Soyad</label>
                  <input
                    id="name"
                    v-model="form.name"
                    type="text"
                    placeholder="Adınız ve soyadınız"
                    required
                  >
                </div>
                <div class="form-group">
                  <label for="phone">Telefon</label>
                  <input
                    id="phone"
                    v-model="form.phone"
                    type="tel"
                    placeholder="05XX XXX XX XX"
                  >
                </div>
              </div>

              <div class="form-group">
                <label for="email">E-posta Adresi</label>
                <input
                  id="email"
                  v-model="form.email"
                  type="email"
                  placeholder="ornek@email.com"
                  required
                >
              </div>

              <div class="form-group">
                <label for="service">Hizmet Alanı</label>
                <select id="service" v-model="form.service" required>
                  <option value="" disabled>Hizmet seçiniz...</option>
                  <option
                    v-for="service in serviceOptions"
                    :key="service.slug"
                    :value="service.slug"
                  >{{ service.title }}</option>
                  <option value="diger">Diğer / Bilgi Almak İstiyorum</option>
                </select>
              </div>

              <div class="form-group">
                <label for="message">Mesajınız</label>
                <textarea
                  id="message"
                  v-model="form.message"
                  placeholder="Kendinizden ve talebinizden kısaca bahsedebilirsiniz..."
                />
                <p class="form-note">
                  🔒 Bilgileriniz gizli tutulur. KVKK kapsamında işlenir, üçüncü taraflarla paylaşılmaz.
                </p>
              </div>

              <div v-if="turnstileEnabled" class="form-group">
                <div
                  class="cf-turnstile"
                  :data-sitekey="turnstileSiteKey"
                  data-callback="onTurnstileSuccess"
                  data-expired-callback="onTurnstileExpired"
                  data-error-callback="onTurnstileExpired"
                />
              </div>

              <button type="submit" class="button button--large contact-form-submit" :disabled="submitting">
                {{ submitting ? 'Gönderiliyor…' : 'Randevu Talebini Gönder' }}
              </button>
              <p v-if="submitError" class="contact-form-error">{{ submitError }}</p>
            </form>
          </div>

          <div v-else class="contact-form-success">
            <div class="contact-form-success__icon">✓</div>
            <h2>Talebiniz Alındı!</h2>
            <p>
              En kısa sürede sizinle iletişime geçeceğiz.
              Acil durumlar için doğrudan arayabilirsiniz.
            </p>
            <a :href="`tel:${phone}`" class="button button--outline">
              {{ phoneDisplay }}
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- HARİTA -->
    <section class="map-section">
      <iframe
        :src="mapsEmbedUrl"
        width="100%"
        height="420"
        class="map-section__frame"
        allowfullscreen
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        title="Ev-Mobil Konum"
      />
    </section>

    <!-- CTA -->
    <section class="section">
      <div class="container cta-banner" :style="contactCtaStyle">
        <h2>{{ contact?.ctaTitle }}</h2>
        <p>{{ contact?.ctaLead }}</p>
        <div class="hero__actions hero__actions--center contact-cta__actions">
          <AppSmartLink
            :to="contact?.ctaPrimaryUrl || `mailto:${email}`"
            class="button button--light button--large"
          >
            {{ contact?.ctaPrimaryLabel || 'E-posta Gönder' }}
          </AppSmartLink>
          <AppSmartLink
            v-if="contact?.ctaSecondaryLabel"
            :to="contact?.ctaSecondaryUrl || `tel:${phone}`"
            class="button button--outline-light button--large"
          >
            {{ contact?.ctaSecondaryLabel || 'Telefon Et' }}
          </AppSmartLink>
        </div>
      </div>
    </section>
  </div>
</template>
