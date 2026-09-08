<script setup lang="ts">
const route = useRoute()

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template>
  <nav class="mbn">
    <NuxtLink to="/" class="mbn__item" :class="{ 'mbn__item--active': isActive('/') }">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      <span>Ana Sayfa</span>
    </NuxtLink>

    <NuxtLink to="/#hizmetler" class="mbn__item">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
      <span>Hizmetler</span>
    </NuxtLink>

    <NuxtLink to="/iletisim" class="mbn__cta" aria-label="Randevu Al">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    </NuxtLink>

    <NuxtLink to="/sss" class="mbn__item" :class="{ 'mbn__item--active': isActive('/sss') }">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
      <span>Yardım</span>
    </NuxtLink>

    <NuxtLink to="/hakkimda" class="mbn__item" :class="{ 'mbn__item--active': isActive('/hakkimda') }">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
      <span>Kurumsal</span>
    </NuxtLink>
  </nav>
</template>

<style scoped>
.mbn { display: none; }

@media (max-width: 768px) {
  .mbn {
    display: flex;
    align-items: center;
    justify-content: space-around;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1100;
    background: rgba(255,255,255,0.97);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border-top: 1px solid var(--line);
    padding: 0.4rem 0.4rem calc(0.4rem + env(safe-area-inset-bottom));
  }
}

.mbn__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  flex: 1;
  padding: 0.3rem 0.2rem;
  color: var(--muted);
  text-decoration: none;
  font-size: 0.62rem;
  font-weight: 600;
  transition: color 150ms;
}
.mbn__item--active,
.mbn__item:active { color: var(--primary-deep); }

.mbn__cta {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.1rem;
  height: 3.1rem;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--gold), var(--primary-mid));
  color: var(--accent-contrast);
  box-shadow: 0 6px 18px rgba(201,163,90,0.4);
  margin: 0 0.3rem;
  transform: translateY(-0.6rem);
  flex-shrink: 0;
}
</style>
