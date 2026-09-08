<script setup lang="ts">
import { usePageSeo } from "../../composables/usePageSeo"

interface BlogPageData { heroEyebrow: string; heroTitle: string; heroLead: string; heroBgImage: string }

const { data: blogPage } = await useFetch<BlogPageData>('/api/blog-page', { key: 'blog-page', server: true, lazy: false })
const route = useRoute()
const { data: posts } = await useFetch<any[]>('/api/blog')

usePageSeo({
  title: blogPage.value?.heroTitle || "Blog",
  description: blogPage.value?.heroLead || "İşitme sağlığı, işitme cihazları ve kişiye özel çözümler hakkında pratik yazıların yer aldığı blog sayfası.",
  path: "/blog"
})

const heroStyle = computed(() => blogPage.value?.heroBgImage ? {
  backgroundImage: `linear-gradient(100deg, rgba(245,243,240,0.96) 38%, rgba(245,243,240,0.55) 65%, rgba(245,243,240,0.08) 100%), url(${blogPage.value.heroBgImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center top'
} : {})

const activeCategory = computed(() => route.query.kategori as string | undefined)

const filteredPosts = computed(() => {
  if (!activeCategory.value) return posts.value ?? []
  return (posts.value ?? []).filter((p: any) => p.category === activeCategory.value)
})

const featuredPost = computed(() =>
  !activeCategory.value
    ? (posts.value?.find((p: any) => p.featured) ?? posts.value?.[0])
    : null
)
const otherPosts = computed(() =>
  filteredPosts.value.filter((p: any) => p.slug !== featuredPost.value?.slug)
)

const categories = computed(() => {
  const map = new Map<string, number>()
  for (const p of posts.value ?? []) {
    if (p.category) map.set(p.category, (map.get(p.category) ?? 0) + 1)
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1])
})

const siteSettings = useState('siteSettings')
const authorName = computed(() => (siteSettings.value as any)?.name || 'Ev-Mobil')

const searchQuery = ref('')
const searchResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  return (posts.value ?? []).filter((p: any) =>
    p.title?.toLowerCase().includes(q) ||
    p.excerpt?.toLowerCase().includes(q) ||
    p.category?.toLowerCase().includes(q) ||
    p.tags?.toLowerCase().includes(q)
  )
})
</script>

<template>
  <div class="bl">

    <!-- ══════ HERO ══════ -->
    <section class="bl-hero" :style="heroStyle">
      <div class="container bl-hero__inner">
        <div class="bl-hero__copy">
          <div class="bl-hero__kicker">
            <span class="bl-hero__dot"></span>
            {{ blogPage?.heroEyebrow || 'Blog' }}
          </div>
          <h1 class="bl-hero__h1">{{ blogPage?.heroTitle || 'Blog' }}</h1>
          <p class="bl-hero__lead">{{ blogPage?.heroLead }}</p>
        </div>
      </div>
    </section>

    <!-- ══════ İÇERİK ══════ -->
    <div class="bl-body">
      <div class="container bl-body__inner">

        <!-- Ana içerik -->
        <main class="bl-main">

          <!-- Kategori filtre çubuğu -->
          <div v-if="activeCategory" class="bl-filter">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
            <span>Kategori: <strong>{{ activeCategory }}</strong></span>
            <NuxtLink to="/blog" class="bl-filter__clear">✕ Filtreyi Kaldır</NuxtLink>
          </div>

          <!-- Öne çıkan yazı -->
          <article v-if="featuredPost && !activeCategory" class="bl-featured">
            <NuxtLink :to="`/blog/${featuredPost.slug}`" class="bl-featured__img-wrap">
              <img v-if="featuredPost.image" :src="featuredPost.image" :alt="featuredPost.title" class="bl-featured__img" />
              <div v-else class="bl-featured__img-placeholder" />
              <span class="bl-featured__badge">Öne Çıkan</span>
            </NuxtLink>
            <div class="bl-featured__body">
              <span v-if="featuredPost.category" class="bl-tag">{{ featuredPost.category }}</span>
              <h2 class="bl-featured__title">
                <NuxtLink :to="`/blog/${featuredPost.slug}`">{{ featuredPost.title }}</NuxtLink>
              </h2>
              <p class="bl-featured__excerpt">{{ featuredPost.excerpt }}</p>
              <div class="bl-featured__meta">
                <span>{{ featuredPost.date }}</span>
                <span v-if="featuredPost.read_time">· {{ featuredPost.read_time }}</span>
              </div>
              <NuxtLink :to="`/blog/${featuredPost.slug}`" class="bl-btn">
                Yazıyı Oku
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </NuxtLink>
            </div>
          </article>

          <!-- Yazı grid -->
          <div class="bl-grid-head">
            <h2>{{ activeCategory ? activeCategory + ' Yazıları' : 'Tüm Yazılar' }}</h2>
            <span class="bl-count">{{ otherPosts.length }} yazı</span>
          </div>

          <div v-if="!otherPosts.length" class="bl-empty">
            Bu kategoride henüz yazı bulunmuyor.
          </div>

          <div class="bl-grid">
            <NuxtLink
              v-for="post in otherPosts"
              :key="post.slug"
              :to="`/blog/${post.slug}`"
              class="bl-card"
            >
              <div class="bl-card__img-wrap">
                <img v-if="post.image" :src="post.image" :alt="post.title" class="bl-card__img" />
                <div v-else class="bl-card__img-placeholder" />
                <span v-if="post.category" class="bl-tag bl-tag--over">{{ post.category }}</span>
              </div>
              <div class="bl-card__body">
                <h3 class="bl-card__title">{{ post.title }}</h3>
                <p class="bl-card__excerpt">{{ post.excerpt }}</p>
                <div class="bl-card__meta">
                  <span>{{ post.date }}</span>
                  <span v-if="post.read_time" class="bl-card__read">{{ post.read_time }} →</span>
                </div>
              </div>
            </NuxtLink>
          </div>
        </main>

        <!-- Sidebar -->
        <aside class="bl-sidebar">

          <!-- Arama -->
          <div class="bl-sidebar__card">
            <h3>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              Ara
            </h3>
            <div class="bl-search">
              <input v-model="searchQuery" type="text" placeholder="Konu veya anahtar kelime…" class="bl-search__input" />
            </div>
            <ul v-if="searchResults.length" class="bl-search__results">
              <li v-for="r in searchResults" :key="r.slug">
                <NuxtLink :to="`/blog/${r.slug}`">{{ r.title }}</NuxtLink>
              </li>
            </ul>
            <p v-else-if="searchQuery.trim()" class="bl-search__empty">Sonuç bulunamadı.</p>
          </div>

          <!-- Kategoriler -->
          <div class="bl-sidebar__card">
            <h3>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
              Kategoriler
            </h3>
            <ul class="bl-cats">
              <li v-for="[cat, count] in categories" :key="cat">
                <NuxtLink :to="`/blog?kategori=${encodeURIComponent(cat)}`" :class="{ 'bl-cats__item--active': activeCategory === cat }" class="bl-cats__item">
                  <span>{{ cat }}</span>
                  <em>{{ count }}</em>
                </NuxtLink>
              </li>
              <li v-if="!categories.length" class="bl-cats__empty">Henüz kategori yok</li>
            </ul>
          </div>

          <!-- CTA -->
          <!-- <div class="bl-sidebar__card bl-sidebar__card--dark">
            <h3>Sorularınız mı var?</h3>
            <p>İşitme cihazları, fiyatlar, ürün seçenekleri ve satış sonrası destek hakkında merak ettikleriniz için bizimle iletişime geçebilirsiniz.</p>
            <NuxtLink to="/iletisim" class="bl-btn bl-btn--white">Teklif Alın</NuxtLink>
          </div> --> 

        </aside>
      </div>
    </div>

  </div>
</template>
