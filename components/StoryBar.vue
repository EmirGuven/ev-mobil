<script setup lang="ts">
import { siteMeta } from "../data/site"

defineProps<{ title?: string }>()

interface Story {
  id: number
  title: string
  image: string
  link_label: string
  link_url: string
  created_at: string
}

const { data: stories } = await useFetch<Story[]>('/api/stories')
const displayStories = computed(() => (stories.value ?? []).slice(0, 5))

const siteSettings = useState<any>('siteSettings')
const brandName = computed(() => siteSettings.value?.name || siteMeta.name)
const faviconUrl = computed(() => siteSettings.value?.favicon || '')

const preloaded = new Set<string>()
function preloadImages() {
  if (typeof window === 'undefined') return
  for (const s of displayStories.value) {
    if (!s.image || preloaded.has(s.image)) continue
    preloaded.add(s.image)
    const img = new Image()
    img.src = s.image
  }
}
watch(displayStories, preloadImages, { immediate: true })

function timeAgo(dateStr?: string) {
  if (!dateStr) return ''
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'şimdi'
  if (mins < 60) return `${mins}dk`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}sa`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}g`
  return `${Math.floor(days / 7)}h`
}

const viewerOpen = ref(false)
const activeIndex = ref(0)
const progress = ref(0)
const paused = ref(false)
const DURATION = 5000

let timer: ReturnType<typeof window.setInterval> | undefined
let startedAt = 0
let elapsedAtPause = 0
let holdStartedAt = 0
const HOLD_THRESHOLD = 220

function clearTimer() {
  if (timer) window.clearInterval(timer)
  timer = undefined
}

function startTimer() {
  clearTimer()
  startedAt = Date.now()
  elapsedAtPause = 0
  progress.value = 0
  timer = window.setInterval(() => {
    const elapsed = Date.now() - startedAt
    progress.value = Math.min(100, (elapsed / DURATION) * 100)
    if (elapsed >= DURATION) next()
  }, 50)
}

function pauseTimer() {
  if (paused.value) return
  paused.value = true
  elapsedAtPause = Date.now() - startedAt
  clearTimer()
}

function resumeTimer() {
  if (!paused.value) return
  paused.value = false
  startedAt = Date.now() - elapsedAtPause
  timer = window.setInterval(() => {
    const elapsed = Date.now() - startedAt
    progress.value = Math.min(100, (elapsed / DURATION) * 100)
    if (elapsed >= DURATION) next()
  }, 50)
}

function openStory(index: number) {
  activeIndex.value = index
  viewerOpen.value = true
  syncScrollLock(true)
  startTimer()
}

function closeStory() {
  viewerOpen.value = false
  paused.value = false
  clearTimer()
  syncScrollLock(false)
}

function next() {
  const list = displayStories.value
  if (activeIndex.value >= list.length - 1) {
    closeStory()
    return
  }
  activeIndex.value++
  startTimer()
}

function prev() {
  if (activeIndex.value <= 0) {
    startTimer()
    return
  }
  activeIndex.value--
  startTimer()
}

function onHoldStart() {
  holdStartedAt = Date.now()
  pauseTimer()
}

function onHoldEnd(action: () => void) {
  const heldFor = Date.now() - holdStartedAt
  resumeTimer()
  if (heldFor < HOLD_THRESHOLD) action()
}

function syncScrollLock(locked: boolean) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('is-locked', locked)
  document.body.classList.toggle('is-locked', locked)
}

onBeforeUnmount(() => {
  clearTimer()
  syncScrollLock(false)
})
</script>

<template>
  <div v-if="displayStories.length" class="story-bar">
    <p v-if="title" class="story-bar__heading">{{ title }}</p>
    <div class="story-bar__row">
      <button
        v-for="(s, i) in displayStories"
        :key="s.id"
        class="story-bar__item"
        @click="openStory(i)"
      >
        <span class="story-bar__ring">
          <img v-if="s.image" :src="s.image" :alt="s.title" />
        </span>
        <span v-if="s.title" class="story-bar__label">{{ s.title }}</span>
      </button>
    </div>

    <Teleport to="body">
      <div v-if="viewerOpen" class="story-viewer">
        <div class="story-viewer__bars">
          <div v-for="(s, i) in displayStories" :key="s.id" class="story-viewer__bar">
            <div
              class="story-viewer__bar-fill"
              :style="{ width: i < activeIndex ? '100%' : i === activeIndex ? `${progress}%` : '0%' }"
            />
          </div>
        </div>

        <div class="story-viewer__head">
          <span class="story-viewer__avatar">
            <img v-if="faviconUrl" :src="faviconUrl" :alt="brandName" />
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </span>
          <span class="story-viewer__brand">{{ brandName }}</span>
          <span v-if="displayStories[activeIndex]?.created_at" class="story-viewer__time">{{ timeAgo(displayStories[activeIndex]?.created_at) }}</span>
          <button class="story-viewer__close" @click="closeStory">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <img
          v-if="displayStories[activeIndex]?.image"
          :src="displayStories[activeIndex]?.image"
          :alt="displayStories[activeIndex]?.title"
          class="story-viewer__image"
        />

        <div class="story-viewer__nav">
          <button
            class="story-viewer__nav-zone story-viewer__nav-zone--left"
            aria-label="Önceki"
            @pointerdown="onHoldStart"
            @pointerup="onHoldEnd(prev)"
            @pointerleave="paused && resumeTimer()"
          />
          <button
            class="story-viewer__nav-zone story-viewer__nav-zone--right"
            aria-label="Sonraki"
            @pointerdown="onHoldStart"
            @pointerup="onHoldEnd(next)"
            @pointerleave="paused && resumeTimer()"
          />
        </div>

        <p v-if="displayStories[activeIndex]?.title" class="story-viewer__caption">{{ displayStories[activeIndex]?.title }}</p>

        <NuxtLink
          v-if="displayStories[activeIndex]?.link_url && displayStories[activeIndex]?.link_label"
          :to="displayStories[activeIndex]?.link_url"
          class="story-viewer__cta"
        >
          {{ displayStories[activeIndex]?.link_label }}
        </NuxtLink>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.story-bar { display: none; }

@media (max-width: 768px) {
  .story-bar {
    display: block;
    margin-top: 0.9rem;
  }
}

.story-bar__heading {
  margin: 0 0 0.7rem;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--primary-deep);
}

.story-bar__row {
  display: flex;
  gap: 1.1rem;
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 0.2rem;
}
.story-bar__row::-webkit-scrollbar { display: none; }

.story-bar__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  width: 4.4rem;
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

.story-bar__ring {
  width: 3.8rem;
  height: 3.8rem;
  border-radius: 50%;
  padding: 2.5px;
  background: linear-gradient(135deg, var(--gold), var(--primary-mid));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.story-bar__ring img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #fff;
  display: block;
}

.story-bar__label {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* ── Tam ekran izleyici ── */
.story-viewer {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
}

.story-viewer__bars {
  position: absolute;
  top: 0.6rem;
  left: 0.6rem;
  right: 0.6rem;
  display: flex;
  gap: 0.3rem;
  z-index: 2;
}
.story-viewer__bar {
  flex: 1;
  height: 2.5px;
  border-radius: 2px;
  background: rgba(255,255,255,0.3);
  overflow: hidden;
}
.story-viewer__bar-fill {
  height: 100%;
  background: #fff;
  transition: width 50ms linear;
}

.story-viewer__head {
  position: absolute;
  top: 1.15rem;
  left: 0.8rem;
  right: 0.8rem;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.story-viewer__avatar {
  width: 1.9rem;
  height: 1.9rem;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--surface-dark);
  border: 1.5px solid rgba(255,255,255,0.7);
}
.story-viewer__avatar img { width: 100%; height: 100%; object-fit: cover; display: block; }

.story-viewer__brand {
  color: #fff;
  font-weight: 700;
  font-size: 0.83rem;
  text-shadow: 0 1px 6px rgba(0,0,0,0.5);
}

.story-viewer__time {
  color: rgba(255,255,255,0.75);
  font-size: 0.78rem;
  text-shadow: 0 1px 6px rgba(0,0,0,0.5);
}

.story-viewer__close {
  margin-left: auto;
  width: 2.2rem;
  height: 2.2rem;
  border-radius: 50%;
  background: rgba(0,0,0,0.35);
  color: #fff;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
}

.story-viewer__caption {
  position: absolute;
  bottom: 6.5rem;
  left: 1.2rem;
  right: 1.2rem;
  z-index: 2;
  margin: 0;
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
  text-shadow: 0 1px 8px rgba(0,0,0,0.6);
}

.story-viewer__image {
  max-width: 100%;
  max-height: 100%;
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #000;
}

.story-viewer__nav {
  position: absolute;
  inset: 0;
  display: flex;
  z-index: 1;
}
.story-viewer__nav-zone {
  flex: 1;
  background: none;
  border: none;
  height: 100%;
  cursor: pointer;
}

.story-viewer__cta {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  background: #fff;
  color: var(--surface-dark);
  font-weight: 700;
  font-size: 0.85rem;
  padding: 0.7rem 1.6rem;
  border-radius: 999px;
  text-decoration: none;
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}
</style>
