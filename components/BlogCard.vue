<script setup lang="ts">
defineProps<{
  title: string
  excerpt: string
  image: string
  category: string
  readTime: string
  date: string
  slug: string
}>()
</script>

<template>
  <article class="blog-card">
    <NuxtLink :to="`/blog/${slug}`" class="blog-card__image" :aria-label="title" :title="title">
      <img :src="image" :alt="title">
    </NuxtLink>
    <div class="blog-card__body">
      <span class="blog-card__category">{{ category }}</span>
      <h3>
        <NuxtLink :to="`/blog/${slug}`">{{ title }}</NuxtLink>
      </h3>
      <p>{{ excerpt }}</p>
      <div class="blog-card__meta">
        <span>{{ date }}</span>
        <span>{{ readTime }}</span>
      </div>
    </div>
  </article>
</template>
