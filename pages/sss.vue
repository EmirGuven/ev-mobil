<script setup lang="ts">
import { usePageSeo } from "../composables/usePageSeo"
import { buildPageCtaBackgroundStyle } from "../utils/page-cta"

interface FaqItem  { id: number; question: string; answer: string }
interface FaqGroup { id: number; category: string; items: FaqItem[] }
interface SssPage  {
  heroEyebrow: string; heroTitle: string; heroLead: string; heroBgImage: string
  ctaTitle: string; ctaLead: string; ctaBgImage: string
  ctaPrimaryLabel: string; ctaPrimaryUrl: string
  ctaSecondaryLabel: string; ctaSecondaryUrl: string
}

const [{ data: page }, { data: faqs }] = await Promise.all([
  useFetch<SssPage>('/api/sss-page'),
  useFetch<FaqGroup[]>('/api/faq'),
])

usePageSeo({
  title: page.value?.heroTitle || "Sık Sorulan Sorular – Ev-Mobil",
  description: page.value?.heroLead || "İşitme cihazları ve hizmetlerimiz hakkında sık sorulan soruların yanıtları.",
  path: "/sss"
})

const faqCtaStyle = computed(() => {
  return buildPageCtaBackgroundStyle(page.value?.ctaBgImage)
})

const searchQuery = ref('')
const activeGroup = ref<number | null>(null)
const openItemId  = ref<number | null>(null)

watch(faqs, (val) => {
  if (val?.length && activeGroup.value === null) {
    activeGroup.value = val[0]?.id ?? null
  }
}, { immediate: true })

const currentGroup = computed(() =>
  faqs.value?.find(g => g.id === activeGroup.value) ?? faqs.value?.[0]
)

const totalCount = computed(() =>
  faqs.value?.reduce((s, g) => s + g.items.length, 0) ?? 0
)

const isSearching = computed(() => searchQuery.value.trim().length > 0)

const searchResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  const results: Array<{ group: string; item: FaqItem }> = []
  for (const group of faqs.value ?? []) {
    for (const item of group.items) {
      if (item.question.toLowerCase().includes(q) || item.answer.toLowerCase().includes(q)) {
        results.push({ group: group.category, item })
      }
    }
  }
  return results
})

function toggleItem(id: number) {
  openItemId.value = openItemId.value === id ? null : id
}

function selectGroup(id: number) {
  activeGroup.value = id
  openItemId.value = null
  searchQuery.value = ''
}
</script>

<template>
  <div class="sss-page">
    <!-- YARDIM MERKEZİ -->
    <section class="section section--white sss-help">
      <div class="container">
        <div class="sss-help__shell">

        <!-- Üst başlık + arama satırı -->
        <div class="faq-topbar">
          <div class="faq-topbar__left">
            <p class="eyebrow">Yardım Merkezi</p>
            <h2 class="faq-topbar__title">Ne aramak istersiniz?</h2>
            <p class="faq-topbar__sub">
              <strong>{{ totalCount }}</strong> yanıtlı soru &nbsp;·&nbsp;
              <strong>{{ faqs?.length }}</strong> konu başlığı
            </p>
            <div class="faq-topbar__pills">
              <span class="faq-topbar__pill">Aradığınız yanıtlar tek sayfada</span>
              <span class="faq-topbar__pill">Konu bazlı kolay gezinme</span>
            </div>
          </div>
          <div class="faq-topbar__right">
            <!-- Arama -->
        <div class="faq-search-wrap">
          <div class="faq-search">
            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input v-model="searchQuery" type="text" placeholder="Soru veya konu ara..." class="faq-search__input" />
            <button v-if="searchQuery" class="faq-search__clear" @click="searchQuery = ''">
              <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
          </div><!-- /faq-topbar__right -->
        </div><!-- /faq-topbar -->

        <!-- Arama sonuçları -->
        <div v-if="isSearching" class="faq-search-results">
          <div v-if="searchResults.length === 0" class="faq-empty">
            <svg class="faq-empty__icon" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <p class="faq-empty__title">"<em>{{ searchQuery }}</em>" için sonuç bulunamadı.</p>
            <p class="faq-empty__text">Farklı bir kelime deneyin veya doğrudan bize yazın.</p>
            <NuxtLink to="/iletisim" class="button button--outline faq-empty__action">Bize Sorun →</NuxtLink>
          </div>
          <div v-else class="faq-result-list">
            <p class="faq-result-count"><strong>{{ searchResults.length }}</strong> sonuç bulundu — "<em>{{ searchQuery }}</em>"</p>
            <div
              v-for="({ group, item }) in searchResults"
              :key="item.id"
              class="faq-accordion faq-accordion--search"
              :class="{ 'faq-accordion--open': openItemId === item.id }"
            >
              <button class="faq-accordion__head" @click="toggleItem(item.id)">
                <span class="faq-accordion__q-wrap">
                  <span class="faq-accordion__category-badge">{{ group }}</span>
                  <span class="faq-accordion__question">{{ item.question }}</span>
                </span>
                <svg class="faq-accordion__chevron" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <div class="faq-accordion__body"><p>{{ item.answer }}</p></div>
            </div>
          </div>
        </div>

        <!-- Kategori + Sorular -->
        <div v-else class="faq-layout">

          <!-- Sol: Kategori tabları -->
          <nav class="faq-tabs faq-tabs--sticky">
            <div class="faq-tabs__label">Konular</div>
            <button
              v-for="group in faqs"
              :key="group.id"
              class="faq-tab"
              :class="{ 'faq-tab--active': group.id === activeGroup }"
              @click="selectGroup(group.id)"
            >
              <span class="faq-tab__label">{{ group.category }}</span>
              <span class="faq-tab__count">{{ group.items.length }}</span>
            </button>
            <div class="faq-tabs__footer">
              <NuxtLink to="/iletisim" class="faq-tabs__cta">
                <svg width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l1.84-1.84a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                Cevap bulamadım, teklif iste
              </NuxtLink>
            </div>
          </nav>

          <!-- Sağ: Accordion -->
          <div class="faq-panel faq-panel--card">
            <div class="faq-panel__head">
              <h2 class="faq-panel__title">{{ currentGroup?.category }}</h2>
              <span class="faq-panel__badge">{{ currentGroup?.items.length }} soru</span>
            </div>

            <div class="faq-panel__list">
              <div
                v-for="(item, idx) in currentGroup?.items"
                :key="item.id"
                class="faq-accordion"
                :class="{ 'faq-accordion--open': openItemId === item.id }"
              >
                <button class="faq-accordion__head" @click="toggleItem(item.id)">
                  <span class="faq-accordion__num">{{ idx + 1 }}</span>
                  <span class="faq-accordion__question">{{ item.question }}</span>
                  <svg class="faq-accordion__chevron" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>
                </button>
                <div class="faq-accordion__body"><p>{{ item.answer }}</p></div>
              </div>
            </div>
          </div>
        </div>

        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="sss-cta">
      <div class="container">
        <div class="sss-cta__inner" :style="faqCtaStyle">
          <p class="sss-cta__kicker">Hala yanıt bulamadınız mı?</p>
          <h2 class="sss-cta__title">{{ page?.ctaTitle || 'Cevabını bulamadığınız bir sorunuz mu var?' }}</h2>
          <p class="sss-cta__lead">{{ page?.ctaLead || 'Aklınızdaki soru burada yer almıyorsa doğrudan iletişime geçebilirsiniz.' }}</p>
          <div class="sss-cta__signals">
            <span class="sss-cta__signal">Online ve yüz yüze seçenekler</span>
            <span class="sss-cta__signal">Size uygun zaman planı</span>
          </div>
          <div class="sss-cta__actions">
            <AppSmartLink
              :to="page?.ctaPrimaryUrl || '/iletisim'"
              class="button button--light button--large"
            >
              {{ page?.ctaPrimaryLabel || 'İletişime Geçin' }}
            </AppSmartLink>
            <AppSmartLink
              v-if="page?.ctaSecondaryLabel"
              :to="page?.ctaSecondaryUrl || '/iletisim'"
              class="button button--outline-light button--large"
            >
              {{ page?.ctaSecondaryLabel || 'Teklif Alın' }}
            </AppSmartLink>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
