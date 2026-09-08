<script setup lang="ts">
import { usePageSeo } from "../../composables/usePageSeo"

const route = useRoute()
const slug = route.params.slug as string

const { data: post } = await useFetch<any>(`/api/blog?slug=${slug}`)

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: "Yazı bulunamadı" })
}

const { data: allPosts } = await useFetch<any[]>('/api/blog')
const relatedPosts = computed(() => allPosts.value?.filter((p: any) => p.slug !== slug).slice(0, 3) ?? [])

// Bu yazının etiketleri: önce kendi tags alanı, sonra category'si
const postTags = computed(() => {
  const tags: string[] = []
  if (post.value?.tags) {
    tags.push(...post.value.tags.split(',').map((t: string) => t.trim()).filter(Boolean))
  }
  if (post.value?.category && !tags.includes(post.value.category)) {
    tags.unshift(post.value.category)
  }
  return tags
})

// Sidebar: tüm kategoriler benzersiz olarak
const allCategories = computed(() => {
  const map = new Map<string, number>()
  for (const p of allPosts.value ?? []) {
    if (p.category) map.set(p.category, (map.get(p.category) ?? 0) + 1)
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1])
})

const siteSettings = useState('siteSettings')
const authorName = computed(() => (siteSettings.value as any)?.name || 'Ev-Mobil')

usePageSeo({
  title: post.value?.title ?? '',
  description: post.value?.excerpt ?? '',
  path: `/blog/${slug}`,
  image: post.value?.image ?? ''
})
</script>

<template>
  <div class="section">
    <div class="container article-layout">
      <main>
        <nav class="breadcrumb">
          <NuxtLink to="/">Ana Sayfa</NuxtLink>
          <span>/</span>
          <NuxtLink to="/blog">Blog</NuxtLink>
          <span>/</span>
          <span>{{ post?.title }}</span>
        </nav>

        <div class="article-cover">
          <img :src="post?.image" :alt="post?.title">
        </div>

        <article class="article">
          <h1>{{ post?.title }}</h1>
          <div class="article__meta">
            <strong>{{ authorName }}</strong>
            <span>{{ post?.date }} • {{ post?.read_time }}</span>
          </div>

          <div class="article__content">
            <p v-if="post?.quote" class="article__quote">{{ post.quote }}</p>
            <!-- eslint-disable-next-line vue/no-v-html -->
            <div v-if="post?.content" v-html="post.content"></div>

           
          </div>
        </article>
      </main>

      <aside class="sidebar">
        <div class="sidebar-card author-card">
          <strong>{{ authorName }}</strong>
          <p>İşitme sağlığı ve işitme cihazlarında kişiye özel, güvenilir destek.</p>
        </div>

        <div class="sidebar-card">
          <h3>Etiketler</h3>
          <div class="tag-list">
            <NuxtLink
              v-for="tag in postTags"
              :key="tag"
              :to="`/blog?kategori=${encodeURIComponent(tag)}`"
              class="tag-link"
            >{{ tag }}</NuxtLink>
            <span v-if="!postTags.length" style="color:#94a3b8;font-size:.85rem">Etiket yok</span>
          </div>
        </div>

        <div class="sidebar-card">
          <h3>Kategoriler</h3>
          <ul class="category-list">
            <li v-for="[cat, count] in allCategories" :key="cat">
              <NuxtLink :to="`/blog?kategori=${encodeURIComponent(cat)}`">{{ cat }}</NuxtLink>
              <em>{{ count }}</em>
            </li>
            <li v-if="!allCategories.length" style="color:#94a3b8;font-size:.85rem">Henüz kategori yok</li>
          </ul>
        </div>

        <div class="sidebar-card sidebar-card--dark">
          <h3>Sevkiyat planınız hazır mı?</h3>
          <p>İletişim sayfasından talep bırakın, yükünüze uygun operasyon planını birlikte çıkaralım.</p>
          <NuxtLink to="/iletisim" class="button">Randevu Al</NuxtLink>
        </div>
      </aside>
    </div>

    <section class="container related-posts">
      <div class="section__split section__split--compact">
        <h2 class="subheading">İlgili Yazılar</h2>
        <NuxtLink to="/blog" class="section__link">Tüm yazılar</NuxtLink>
      </div>
      <div class="grid grid--3">
        <BlogCard
          v-for="item in relatedPosts"
          :key="item.slug"
          :title="item.title"
          :excerpt="item.excerpt"
          :image="item.image"
          :category="item.category"
          :date="item.date"
          :read-time="item.read_time"
          :slug="item.slug"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.tag-link {
  display: inline-block;
  padding: .25rem .65rem;
  background: #f0f7ff;
  color: #1b4f72;
  border-radius: 20px;
  font-size: .8rem;
  text-decoration: none;
  border: 1px solid #bfdbfe;
  transition: background .15s;
  white-space: normal;
  overflow-wrap: anywhere;
}
.tag-link:hover { background: #dbeafe; }
</style>
