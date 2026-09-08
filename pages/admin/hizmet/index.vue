<template>
  <div class="admin-page">
    <div class="admin-page__header service-admin-header">
      <div>
        <h1>Hizmetler</h1>
        <p class="service-admin-header__lead">
          Mevcut hizmet sayfalarını yönetin veya yeni bir hizmet oluşturun.
        </p>
      </div>
    </div>

    <div class="service-admin-grid">
      <section class="service-admin-panel">
        <div class="service-admin-panel__head">
          <h2>Yeni Hizmet Oluştur</h2>
          <p>Yeni bir hizmet açınca doğrudan düzenleme ekranına yönlendirilirsiniz.</p>
        </div>

        <div v-if="createError" class="admin-login-error">{{ createError }}</div>

        <div class="service-admin-form">
          <div class="form-group">
            <label for="service-title">Hizmet Adı</label>
            <input
              id="service-title"
              v-model="createForm.title"
              type="text"
              placeholder="Örn. Frigolu Taşıma"
            >
          </div>

          <div class="form-group">
            <label for="service-slug">
              Bağlantı Adı
              <span class="service-admin-hint">Boş bırakırsanız otomatik üretilir</span>
            </label>
            <input
              id="service-slug"
              v-model="createForm.slug"
              type="text"
              placeholder="frigolu-tasima"
              @input="slugTouched = true"
            >
          </div>

          <button class="btn-admin-primary" :disabled="creating" @click="createService">
            {{ creating ? 'Oluşturuluyor…' : 'Hizmet Oluştur' }}
          </button>
        </div>
      </section>

      <section class="service-admin-panel">
        <div class="service-admin-panel__head">
          <h2>Mevcut Hizmetler</h2>
          <p>{{ services.length }} hizmet bulundu.</p>
        </div>

        <div v-if="pending" class="admin-loading">Yükleniyor…</div>
        <div v-else-if="!services.length" class="admin-empty">Henüz hizmet eklenmemiş.</div>

        <div v-else class="service-admin-list">
          <article v-for="service in services" :key="service.slug" class="service-admin-card">
            <div class="service-admin-card__body">
              <p class="service-admin-card__slug">/{{ service.slug }}</p>
              <h3>{{ service.title }}</h3>
              <p class="service-admin-card__desc">
                {{ service.description || 'Açıklama henüz girilmedi.' }}
              </p>
            </div>

            <div class="service-admin-card__actions">
              <NuxtLink :to="`/admin/hizmet/${service.slug}`" class="btn-admin-primary">
                Düzenle
              </NuxtLink>
              <a :href="`/${service.slug}`" target="_blank" rel="noreferrer" class="btn-admin-secondary">
                Canlıda Gör
              </a>
              <button
                class="btn-admin-secondary service-admin-delete"
                :disabled="deletingSlug === service.slug"
                @click="deleteService(service)"
              >
                {{ deletingSlug === service.slug ? 'Siliniyor…' : 'Sil' }}
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: "admin", middleware: "admin" })

interface ServiceSummary {
  id: number
  slug: string
  title: string
  eyebrow: string
  description: string
  image: string
}

const { data, pending, refresh } = await useFetch<ServiceSummary[]>("/api/admin/services")

const services = computed(() => data.value ?? [])

const createForm = reactive({
  title: "",
  slug: "",
})

const slugTouched = ref(false)
const creating = ref(false)
const deletingSlug = ref("")
const createError = ref("")

watch(() => createForm.title, (title) => {
  if (slugTouched.value) return
  createForm.slug = slugify(title)
})

function slugify(value: string) {
  return String(value || "")
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
}

async function createService() {
  creating.value = true
  createError.value = ""

  try {
    const result = await $fetch<{ slug: string }>("/api/admin/services", {
      method: "POST",
      body: {
        title: createForm.title,
        slug: createForm.slug,
      },
    })

    createForm.title = ""
    createForm.slug = ""
    slugTouched.value = false

    await refresh()
    await navigateTo(`/admin/hizmet/${result.slug}`)
  } catch (error: any) {
    createError.value = error?.data?.message || "Hizmet oluşturulamadı."
  } finally {
    creating.value = false
  }
}

async function deleteService(service: ServiceSummary) {
  if (!window.confirm(`"${service.title}" hizmetini silmek istediğinize emin misiniz?`)) return

  deletingSlug.value = service.slug
  try {
    await $fetch(`/api/admin/service/${service.slug}`, { method: "DELETE" })
    await refresh()
  } catch (error: any) {
    createError.value = error?.data?.message || "Hizmet silinemedi."
  } finally {
    deletingSlug.value = ""
  }
}
</script>

<style scoped>
.service-admin-header {
  align-items: flex-start;
}

.service-admin-header__lead {
  margin: 0.35rem 0 0;
  color: #6b7280;
  font-size: 0.92rem;
}

.service-admin-grid {
  display: grid;
  grid-template-columns: minmax(320px, 360px) minmax(0, 1fr);
  gap: 1.5rem;
  align-items: start;
}

.service-admin-panel {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.service-admin-panel__head {
  margin-bottom: 1.25rem;
}

.service-admin-panel__head h2 {
  margin: 0 0 0.3rem;
  font-size: 1rem;
  color: #111827;
}

.service-admin-panel__head p {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
}

.service-admin-form {
  display: grid;
  gap: 1rem;
}

.service-admin-hint {
  margin-left: 0.45rem;
  color: #9ca3af;
  font-size: 0.74rem;
  font-weight: 500;
  text-transform: none;
}

.service-admin-list {
  display: grid;
  gap: 0.9rem;
}

.service-admin-card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
  background: #fafafa;
}

.service-admin-card__body {
  min-width: 0;
}

.service-admin-card__slug {
  margin: 0 0 0.35rem;
  color: #1b4f72;
  font-size: 0.78rem;
  font-weight: 700;
}

.service-admin-card h3 {
  margin: 0 0 0.4rem;
  font-size: 1rem;
  color: #111827;
}

.service-admin-card__desc {
  margin: 0;
  color: #6b7280;
  font-size: 0.86rem;
  line-height: 1.6;
}

.service-admin-card__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: flex-end;
  flex-shrink: 0;
}

.service-admin-delete {
  color: #b91c1c;
}

@media (max-width: 980px) {
  .service-admin-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .service-admin-panel {
    padding: 1.15rem;
  }

  .service-admin-card {
    flex-direction: column;
  }

  .service-admin-card__actions {
    width: 100%;
    justify-content: stretch;
  }

  .service-admin-card__actions > * {
    width: 100%;
    justify-content: center;
  }
}
</style>
