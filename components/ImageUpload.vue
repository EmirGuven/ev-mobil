<template>
  <div class="img-upload">
    <div v-if="modelValue && !multiple" class="img-upload__preview">
      <img :src="modelValue" alt="Onizleme" />
      <button type="button" class="img-upload__remove" @click="$emit('update:modelValue', '')">✕</button>
    </div>

    <label
      class="img-upload__drop"
      :class="{ 'img-upload__drop--over': isDragging, 'img-upload__drop--loading': uploading }"
      @dragover.prevent="isDragging = true"
      @dragleave="isDragging = false"
      @drop.prevent="onDrop"
    >
      <input
        ref="fileInput"
        type="file"
        :accept="accept"
        :multiple="multiple"
        style="display:none"
        @change="onFileChange"
      />

      <template v-if="uploading">
        <span class="img-upload__spinner"></span>
        <span>Yükleniyor…</span>
      </template>
      <template v-else>
        <svg width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
          <path d="M3 15v4a2 2 0 002 2h14a2 2 0 002-2v-4M12 3v12m0-12L8 7m4-4 4 4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span>{{ label }}</span>
        <small>{{ hint }}</small>
      </template>
    </label>

    <!-- Hata -->
    <p v-if="error" class="img-upload__error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  accept?: string
  label?: string
  hint?: string
  multiple?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'uploaded', url: string): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const uploading = ref(false)
const error = ref('')
const accept = computed(() => props.accept || 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml')
const label = computed(() => props.label || 'Fotoğraf yükle')
const hint = computed(() => props.hint || 'Sürükle bırak veya seç · JPG, PNG, WebP, max 5 MB')
const multiple = computed(() => Boolean(props.multiple))

async function upload(file: File) {
  error.value = ''
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await $fetch<{ url: string }>('/api/admin/upload', {
      method: 'POST',
      body: fd,
    })
    if (!multiple.value) emit('update:modelValue', res.url)
    emit('uploaded', res.url)
  } catch (err: any) {
    error.value = err?.data?.message || 'Yükleme başarısız.'
  } finally {
    uploading.value = false
    isDragging.value = false
  }
}

async function uploadFiles(files: FileList | File[]) {
  const selected = Array.from(files)
  for (const file of selected) {
    await upload(file)
  }
  if (fileInput.value) fileInput.value.value = ''
}

function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files?.length) uploadFiles(files)
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files?.length) uploadFiles(files)
}
</script>

<style scoped>
.img-upload { display: flex; flex-direction: column; gap: .6rem; }

.img-upload__preview {
  position: relative;
  display: inline-flex;
  align-items: flex-start;
  gap: .5rem;
}
.img-upload__preview img {
  max-width: 220px;
  max-height: 180px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
}
.img-upload__remove {
  position: absolute;
  top: 4px; right: 4px;
  background: rgba(0,0,0,.55);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 22px; height: 22px;
  font-size: 12px;
  cursor: pointer;
  line-height: 1;
  display: flex; align-items: center; justify-content: center;
}

.img-upload__drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: .35rem;
  padding: 1.5rem 1rem;
  border: 2px dashed #cbd5e1;
  border-radius: 10px;
  cursor: pointer;
  color: #64748b;
  font-size: .875rem;
  transition: border-color .2s, background .2s;
  min-height: 110px;
}
.img-upload__drop:hover,
.img-upload__drop--over  { border-color: #1b4f72; background: #f0f7ff; color: #1b4f72; }
.img-upload__drop--loading { pointer-events: none; opacity: .7; }
.img-upload__drop small  { color: #94a3b8; font-size: .78rem; }
.img-upload__drop svg    { color: #94a3b8; }
.img-upload__drop:hover svg,
.img-upload__drop--over svg { color: #1b4f72; }

.img-upload__spinner {
  width: 22px; height: 22px;
  border: 3px solid #e2e8f0;
  border-top-color: #1b4f72;
  border-radius: 50%;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.img-upload__error { color: #dc2626; font-size: .82rem; margin: 0; }
</style>
