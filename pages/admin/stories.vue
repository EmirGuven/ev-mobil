<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h1>Story'ler</h1>
    </div>
    <p class="admin-form__hint">
      Sadece mobil cihazlarda, header'ın altında Instagram tarzı yuvarlak story şeridi olarak gösterilir.
      Tıklanınca tam ekran açılır. Boş bırakılırsa şerit hiç görünmez.
    </p>

    <!-- YENİ STORY -->
    <div class="admin-form" style="margin-bottom:2rem;">
      <h2 class="admin-form__section-title">Yeni Story Ekle</h2>
      <div class="admin-form__grid">
        <div class="form-group" style="grid-column:1/-1">
          <label>Görsel</label>
          <ImageUpload v-model="newStory.image" label="Story görseli yükle" hint="Dikey/kare görsel önerilir" />
        </div>
        <div class="form-group">
          <label>Başlık</label>
          <input v-model="newStory.title" type="text" placeholder="Örn. Yeni Cihazlar" />
        </div>
        <div class="form-group">
          <label>Buton Metni (opsiyonel)</label>
          <input v-model="newStory.link_label" type="text" placeholder="Detaylı Bilgi" />
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label>Buton Linki (opsiyonel)</label>
          <input v-model="newStory.link_url" type="text" placeholder="/isitme-cihazlari" />
        </div>
      </div>
      <div class="admin-form__actions">
        <button type="button" class="btn-admin-primary" :disabled="!newStory.image || adding" @click="addStory">
          {{ adding ? 'Ekleniyor…' : 'Story Ekle' }}
        </button>
      </div>
    </div>

    <!-- MEVCUT STORYLER -->
    <div v-if="pending" class="admin-loading">Yükleniyor…</div>
    <div v-else-if="!stories.length" class="admin-form__hint">Henüz story eklenmedi.</div>
    <div v-else class="stories-list">
      <div v-for="(s, i) in stories" :key="s.id" class="story-row">
        <img v-if="s.image" :src="s.image" class="story-row__thumb" alt="" />
        <div class="story-row__fields">
          <div class="admin-form__grid">
            <div class="form-group">
              <label>Başlık</label>
              <input v-model="s.title" type="text" />
            </div>
            <div class="form-group">
              <label>Buton Metni</label>
              <input v-model="s.link_label" type="text" placeholder="Detaylı Bilgi" />
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label>Buton Linki</label>
              <input v-model="s.link_url" type="text" placeholder="/isitme-cihazlari" />
            </div>
          </div>
          <label class="story-row__active">
            <input v-model="s.activeBool" type="checkbox" />
            Aktif (sitede görünsün)
          </label>
        </div>
        <div class="story-row__actions">
          <button type="button" class="btn-admin-secondary" :disabled="i === 0" @click="moveStory(i, -1)">↑</button>
          <button type="button" class="btn-admin-secondary" :disabled="i === stories.length - 1" @click="moveStory(i, 1)">↓</button>
          <button type="button" class="btn-admin-primary" @click="saveStory(s)">Kaydet</button>
          <button type="button" class="btn-admin-danger-sm" @click="deleteStory(s.id)">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

interface Story {
  id: number
  title: string
  image: string
  link_label: string
  link_url: string
  sort_order: number
  active: number
  activeBool?: boolean
}

const { data: raw, pending, refresh } = await useFetch<Story[]>('/api/admin/stories')
const stories = reactive<Story[]>([])

watch(raw, (val) => {
  stories.splice(0, stories.length, ...(val ?? []).map(s => ({ ...s, activeBool: !!s.active })))
}, { immediate: true })

const adding = ref(false)
const newStory = reactive({ title: '', image: '', link_label: '', link_url: '' })

async function addStory() {
  if (!newStory.image) return
  adding.value = true
  try {
    await $fetch('/api/admin/stories', { method: 'POST', body: newStory })
    newStory.title = ''
    newStory.image = ''
    newStory.link_label = ''
    newStory.link_url = ''
    await refresh()
  } finally {
    adding.value = false
  }
}

async function saveStory(s: Story) {
  await $fetch(`/api/admin/stories/${s.id}`, {
    method: 'PUT',
    body: { ...s, active: s.activeBool ? 1 : 0 },
  })
  await refresh()
}

async function deleteStory(id: number) {
  if (!confirm('Bu story silinsin mi?')) return
  await $fetch(`/api/admin/stories/${id}`, { method: 'DELETE' })
  await refresh()
}

async function moveStory(index: number, dir: -1 | 1) {
  const target = index + dir
  if (target < 0 || target >= stories.length) return
  const a = stories[index]!
  const b = stories[target]!
  const aOrder = a.sort_order
  const bOrder = b.sort_order
  await Promise.all([
    $fetch(`/api/admin/stories/${a.id}`, { method: 'PUT', body: { ...a, active: a.activeBool ? 1 : 0, sort_order: bOrder } }),
    $fetch(`/api/admin/stories/${b.id}`, { method: 'PUT', body: { ...b, active: b.activeBool ? 1 : 0, sort_order: aOrder } }),
  ])
  await refresh()
}
</script>

<style scoped>
.stories-list { display: flex; flex-direction: column; gap: 1rem; }
.story-row {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #fff;
  align-items: flex-start;
}
.story-row__thumb {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 2px solid #e5e7eb;
}
.story-row__fields { flex: 1; min-width: 0; }
.story-row__active {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: #374151;
  margin-top: 0.5rem;
}
.story-row__actions {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  flex-shrink: 0;
}
</style>
