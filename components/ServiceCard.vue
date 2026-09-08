<script setup lang="ts">
defineProps<{
  title: string
  description: string
  href: string
  icon?: string
}>()
</script>

<template>
  <article class="card">
    <span class="card__icon">
      <svg v-if="href.includes('evden')" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 10.5 12 3l9 7.5"/>
        <path d="M5 9.5V21h14V9.5"/>
        <path d="M9 21v-6h6v6"/>
      </svg>
      <svg v-else-if="href.includes('ofis')" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="2"/>
        <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/>
      </svg>
      <svg v-else-if="href.includes('sehirler') || href.includes('sehirler-arasi')" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 17h4M1 7h15v8H1z"/>
        <path d="M16 10h3l4 4v1h-7z"/>
        <circle cx="5.5" cy="18.5" r="1.5"/>
        <circle cx="18.5" cy="18.5" r="1.5"/>
      </svg>
      <!-- Fallback -->
      <svg v-else xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M4 7h11v8H4z"/>
        <path d="M15 10h3l2 2.5V15h-5z"/>
        <circle cx="7" cy="17.5" r="1.5"/>
        <circle cx="17" cy="17.5" r="1.5"/>
      </svg>
    </span>
    <h3>{{ title }}</h3>
    <p>{{ description }}</p>
    <NuxtLink :to="href" class="card__link">Detaylı incele →</NuxtLink>
  </article>
</template>
