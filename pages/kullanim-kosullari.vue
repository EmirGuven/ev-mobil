<script setup lang="ts">
import { usePageSeo } from "../composables/usePageSeo"

interface LegalPage { slug: string; title: string; content: string; updatedAt: string }

const { data: page } = await useFetch<LegalPage>('/api/legal/kullanim-kosullari')

usePageSeo({
  title: page.value?.title || 'Kullanım Koşulları',
  description: 'Web sitemizin kullanım koşulları ve sorumluluk bildirimi.',
  path: '/kullanim-kosullari'
})

function renderMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .split('\n\n')
    .map(p => p.startsWith('<h') ? p : `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n')
}
</script>

<template>
  <div>
    <section class="page-hero">
      <div class="container">
        <p class="eyebrow">Yasal</p>
        <div class="section-divider" />
        <h1>{{ page?.title }}</h1>
      </div>
    </section>

    <section class="section section--white">
      <div class="container narrow">
        <div
          v-if="page?.content"
          class="legal-content"
          v-html="renderMarkdown(page.content)"
        />
        <p v-else>İçerik yüklenemedi.</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.legal-content :deep(h1) { font-size: 1.8rem; margin: 2rem 0 1rem; }
.legal-content :deep(h2) { font-size: 1.35rem; margin: 2rem 0 0.75rem; color: var(--primary, #1a5276); }
.legal-content :deep(h3) { font-size: 1.1rem; margin: 1.5rem 0 0.5rem; }
.legal-content :deep(p)  { line-height: 1.8; margin-bottom: 1rem; color: var(--text-muted, #555); }
</style>
