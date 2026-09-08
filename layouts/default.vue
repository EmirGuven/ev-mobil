<template>
  <div class="site-shell">
    <SiteHeader />
    <slot />
    <SiteFooter />
    <MobileBottomNav />
  </div>
</template>

<style scoped>
@media (max-width: 768px) {
  .site-shell {
    padding-bottom: calc(3.9rem + env(safe-area-inset-bottom));
  }
}
</style>
