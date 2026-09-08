<template>
  <div class="admin-page">
    <div class="admin-page__header">
      <h1>{{ isNew ? 'Yeni Blog Yazısı' : 'Yazıyı Düzenle' }}</h1>
      <NuxtLink to="/admin/blog" class="btn-admin-secondary">← Geri</NuxtLink>
    </div>

    <div v-if="loadPending" class="admin-loading">Yükleniyor…</div>
    <form v-else class="admin-form" @submit.prevent="handleSave">
      <div v-if="saveError" class="admin-login-error">{{ saveError }}</div>
      <div v-if="saveSuccess" class="admin-success">Kaydedildi!</div>

      <div class="admin-form__grid">
        <!-- Başlık -->
        <div class="form-group" style="grid-column:1/-1">
          <label>Başlık *</label>
          <input v-model="form.title" type="text" required />
        </div>

        <!-- Kategori — dropdown + serbest giriş -->
        <div class="form-group">
          <label>Kategori</label>
          <div class="combo-wrap">
            <input
              v-model="form.category"
              type="text"
              placeholder="Kategori seç veya yaz…"
              autocomplete="off"
              @focus="showCatDrop = true"
              @blur="hideCatDrop"
            />
            <ul v-if="showCatDrop && filteredCats.length" class="combo-drop">
              <li
                v-for="cat in filteredCats"
                :key="cat"
                @mousedown.prevent="pickCat(cat)"
                :class="{ active: form.category === cat }"
              >{{ cat }}</li>
            </ul>
          </div>
        </div>

        <!-- Özet -->
        <div class="form-group">
          <label>Özet</label>
          <textarea v-model="form.excerpt" rows="2" />
        </div>

        <!-- Etiketler — chip sistemi -->
        <div class="form-group" style="grid-column:1/-1">
          <label>Etiketler</label>
          <div class="tag-chips-wrap">
            <span v-for="(tag, i) in tagList" :key="i" class="tag-chip">
              {{ tag }}
              <button type="button" @click="removeTag(i)">✕</button>
            </span>
            <div class="combo-wrap" style="flex:1;min-width:150px">
              <input
                v-model="tagInput"
                type="text"
                placeholder="Etiket ekle ve Enter'a bas…"
                autocomplete="off"
                @keydown.enter.prevent="addTag"
                @keydown.188.prevent="addTag"
                @focus="showTagDrop = true"
                @blur="hideTagDrop"
              />
              <ul v-if="showTagDrop && filteredTags.length" class="combo-drop">
                <li
                  v-for="tag in filteredTags"
                  :key="tag"
                  @mousedown.prevent="pickTag(tag)"
                >{{ tag }}</li>
              </ul>
            </div>
          </div>
          <small style="color:#94a3b8;font-size:.78rem">Enter veya virgül ile ekleyin</small>
        </div>

        <!-- Alıntı -->
        <div class="form-group" style="grid-column:1/-1">
          <label>Alıntı / Vurgu Cümlesi <small style="color:#94a3b8">(isteğe bağlı)</small></label>
          <textarea v-model="form.quote" rows="2" placeholder="Yazı içinde vurgulanacak alıntı cümlesi…" />
        </div>

        <!-- Görsel -->
        <div class="form-group" style="grid-column:1/-1">
          <label>Kapak Görseli</label>
          <ImageUpload v-model="form.image" @uploaded="onImageUploaded" />
        </div>

        <!-- Hero Arka Plan Görseli -->
        <div class="form-group" style="grid-column:1/-1">
          <label>Hero Arka Plan Görseli</label>
          <ImageUpload v-model="form.hero_bg_image" />
          <p style="font-size:0.75rem;color:#9ca3af;margin:4px 0 0">Blog yazısının hero bölümünde kullanılacak arka plan görseli. Boş bırakılırsa kapak görseli kullanılır.</p>
        </div>

        <!-- Okuma süresi + Tarih -->
        <div class="form-group">
          <label>Okuma Süresi</label>
          <input v-model="form.read_time" type="text" placeholder="5 dk" />
        </div>
        <div class="form-group">
          <label>Tarih</label>
          <input v-model="form.date" type="date" />
        </div>
      </div>

      <!-- İçerik -->
      <div class="form-group">
        <label>İçerik (HTML destekler)</label>
        <textarea v-model="form.content" rows="18" class="admin-form__content" />
      </div>

      <div class="admin-form__checkboxes">
        <label class="admin-checkbox">
          <input v-model="form.featured" type="checkbox" />
          Öne Çıkan Yazı
        </label>
        <label class="admin-checkbox">
          <input v-model="form.published" type="checkbox" />
          Yayınla
        </label>
      </div>

      <div class="admin-form__actions">
        <button type="submit" class="btn-admin-primary" :disabled="saving">
          {{ saving ? 'Kaydediliyor…' : 'Kaydet' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: 'admin' })

const route  = useRoute()
const router = useRouter()
const id     = route.params.id as string
const isNew  = id === 'new'

// Mevcut kategori + etiket listesi
const { data: meta } = await useFetch<{ categories: string[]; tags: string[] }>('/api/admin/blog-meta')
const allCategories = computed(() => meta.value?.categories ?? [])
const allTags       = computed(() => meta.value?.tags ?? [])

const form = reactive({
  title:          '',
  excerpt:        '',
  content:        '',
  category:       '',
  tags:           '',
  quote:          '',
  read_time:      '',
  date:           new Date().toISOString().slice(0, 10),
  image:          '',
  hero_bg_image:  '',
  featured:       false,
  published:      true,
})

// Etiket chip yönetimi
const tagList  = computed({
  get: () => form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
  set: (arr: string[]) => { form.tags = arr.join(', ') }
})
const tagInput = ref('')

function addTag() {
  const val = tagInput.value.trim().replace(/,$/, '')
  if (val && !tagList.value.includes(val)) {
    tagList.value = [...tagList.value, val]
  }
  tagInput.value = ''
  showTagDrop.value = false
}
function removeTag(i: number) {
  const arr = [...tagList.value]
  arr.splice(i, 1)
  tagList.value = arr
}
function pickTag(tag: string) {
  if (!tagList.value.includes(tag)) tagList.value = [...tagList.value, tag]
  tagInput.value = ''
  showTagDrop.value = false
}

// Kategori dropdown
const showCatDrop = ref(false)
const filteredCats = computed(() => {
  const q = form.category.toLowerCase()
  return allCategories.value.filter(c => c.toLowerCase().includes(q) && c !== form.category)
})
function pickCat(cat: string) { form.category = cat; showCatDrop.value = false }
function hideCatDrop() { setTimeout(() => { showCatDrop.value = false }, 150) }

// Etiket dropdown
const showTagDrop = ref(false)
const filteredTags = computed(() => {
  const q = tagInput.value.toLowerCase()
  return allTags.value.filter(t => t.toLowerCase().includes(q) && !tagList.value.includes(t))
})
function hideTagDrop() { setTimeout(() => { showTagDrop.value = false }, 150) }

const loadPending = ref(false)
const saving      = ref(false)
const saveError   = ref('')
const saveSuccess = ref(false)

if (!isNew) {
  loadPending.value = true
  try {
    const post = await $fetch<any>(`/api/admin/blog/${id}`)
    Object.assign(form, {
      ...post,
      featured:  Boolean(post.featured),
      published: Boolean(post.published),
    })
  } finally {
    loadPending.value = false
  }
}

async function handleSave() {
  saving.value     = true
  saveError.value  = ''
  saveSuccess.value = false
  try {
    if (isNew) {
      const created = await $fetch<any>('/api/admin/blog', { method: 'POST', body: form })
      await router.push(`/admin/blog/${created.id}`)
    } else {
      await $fetch(`/api/admin/blog/${id}`, { method: 'PUT', body: form })
      saveSuccess.value = true
    }
  } catch (err: any) {
    saveError.value = err?.data?.message || 'Bir hata oluştu.'
  } finally {
    saving.value = false
  }
}

async function onImageUploaded() {
  if (!isNew) { await nextTick(); await handleSave() }
}
</script>

<style scoped>
.combo-wrap { position: relative; }
.combo-drop {
  position: absolute;
  top: calc(100% + 4px);
  left: 0; right: 0;
  background: #fff;
  border: 1px solid #cbd5e0;
  border-radius: 7px;
  box-shadow: 0 4px 16px rgba(0,0,0,.1);
  z-index: 50;
  max-height: 200px;
  overflow-y: auto;
  margin: 0; padding: .3rem 0;
  list-style: none;
}
.combo-drop li {
  padding: .45rem .85rem;
  cursor: pointer;
  font-size: .9rem;
  color: #2d3748;
}
.combo-drop li:hover,
.combo-drop li.active { background: #f0f7ff; color: #1b4f72; }

.tag-chips-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: .4rem;
  align-items: center;
  padding: .4rem .6rem;
  border: 1px solid #cbd5e0;
  border-radius: 8px;
  background: #fff;
  min-height: 42px;
}
.tag-chips-wrap input {
  border: none !important;
  outline: none !important;
  padding: .15rem .3rem;
  font-size: .88rem;
  min-width: 120px;
}
.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: .3rem;
  padding: .2rem .6rem;
  background: #dbeafe;
  color: #1b4f72;
  border-radius: 20px;
  font-size: .82rem;
  white-space: nowrap;
}
.tag-chip button {
  background: none;
  border: none;
  cursor: pointer;
  color: #64748b;
  font-size: .75rem;
  padding: 0;
  line-height: 1;
}
.tag-chip button:hover { color: #dc2626; }
</style>
