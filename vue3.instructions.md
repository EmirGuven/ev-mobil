---
description: 'VueJS 3 and Nuxt 3 development standards and best practices with Composition API and TypeScript'
applyTo: '**/*.vue, **/*.ts, **/*.js, **/*.scss'
---

# VueJS 3 & Nuxt 3 Development Instructions

Instructions for building high-quality VueJS 3 and Nuxt 3 applications with the Composition API, TypeScript, and modern best practices.

## Project Context
- Vue 3.x with Composition API as default
- Nuxt 3.x for full-stack framework capabilities
- TypeScript for type safety
- Single File Components (`.vue`) with `<script setup>` syntax
- Auto-imports for components, composables, and utilities
- Nitro server engine for API and SSR
- Composables for state management (no Pinia)
- Better-SQLite3 for database operations
- Jose (JWT) for authentication
- @nuxtjs/seo module for SEO management
- Official Vue and Nuxt style guides

## Development Standards

### Component File Structure
**MANDATORY ORDER: Components must follow this exact structure:**

```vue
<script setup lang="ts">
</script>

<template>
</template>

<style scoped>
</style>
```

**Rules:**
1. `<script setup>` tag ALWAYS at the top
2. `<template>` tag ALWAYS in the middle
3. `<style scoped>` tag ALWAYS at the bottom
4. NO comments anywhere in the code
5. Props can be defined inline with `defineProps<{}>()` for simple cases

### Props Pattern
**Props can be defined inline for simple cases:**

```typescript
defineProps<{
  label: string
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}>()
```

**Or with withDefaults for default values:**

```typescript
const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
}>(), {
  placeholder: 'Seçin…'
})
```

### Architecture
- Favor the Composition API (`setup` functions and composables) over the Options API
- Organize components and composables by feature or domain for scalability
- Separate UI-focused components (presentational) from logic-focused components (containers)
- Extract reusable logic into composable functions in `composables/` directory (auto-imported in Nuxt)
- Use composables for state management instead of Pinia
- Leverage Nuxt's file-based routing and auto-imports
- Use `server/` directory for API routes and server middleware
- Organize layouts in `layouts/` directory
- Use `pages/` directory for route components
- Store reusable utilities in `utils/` directory (auto-imported)

### TypeScript Integration
- Enable `strict` mode in `tsconfig.json` for maximum type safety
- Use `<script setup lang="ts">` with `defineProps` and `defineEmits`
- Define props inline with type annotations for simple cases
- Use interfaces or type aliases for complex prop and state shapes
- Define types for event handlers, refs, and composables
- Implement generic components and composables where applicable
- Leverage Nuxt's auto-generated types from `.nuxt/nuxt.d.ts`
- Use `#imports` for type-safe auto-imports

### Component Design
- Adhere to the single responsibility principle for components
- Use PascalCase for component names and kebab-case for file names
- Keep components small and focused on one concern
- Use `<script setup>` syntax for brevity and performance
- Validate props with TypeScript types
- Favor slots and scoped slots for flexible composition
- NO comments in component files
- Always follow script-template-style order

### State Management
- Use composables for global state (e.g., `useToast`, `useAdminAuth`)
- Composables are auto-imported from `composables/` directory
- For simple local state, use `ref` and `reactive` within `setup`
- Use `computed` for derived state
- Keep state normalized for complex structures
- Use `useState` for shared state across components in Nuxt
- Use `useNuxtData` for accessing fetched data
- NO Pinia in this project

### Composition API Patterns
- Create reusable composables for shared logic, e.g., `useFetch`, `useAuth`
- Composables in `composables/` directory are auto-imported
- Use `watch` and `watchEffect` with precise dependency lists
- Cleanup side effects in `onUnmounted` or `watch` cleanup callbacks
- Use `provide`/`inject` sparingly for deep dependency injection
- Leverage Nuxt's built-in composables: `useAsyncData`, `useFetch`, `useNuxtApp`, `useRuntimeConfig`

### Nuxt-Specific Patterns
- Use `useAsyncData` for server-side data fetching with caching
- Use `useFetch` as a wrapper around `useAsyncData` and `$fetch`
- Use `useLazyAsyncData` and `useLazyFetch` for client-side data fetching
- Implement `definePageMeta` for route-level configuration
- Use `navigateTo` for programmatic navigation
- Use `useHead` and `useSeoMeta` for SEO and meta tags
- Leverage `useRuntimeConfig` for environment variables
- Use `useNuxtApp` to access Nuxt instance and hooks
- Use `useRoute` and `useRouter` for routing operations
- Implement middleware in `middleware/` directory
- Use plugins in `plugins/` directory for global functionality
- Leverage server routes in `server/api/` and `server/middleware/`

### Data Fetching (Nuxt)
- Use `useFetch` or `useAsyncData` for data fetching
- Implement proper key management for cache invalidation
- Handle loading, error, and success states with returned composable values
- Use `refresh()` and `clear()` methods for data management
- Implement optimistic updates with `pending` and `data` refs
- Use `getCachedData` option for custom cache strategies
- Leverage `lazy: true` option for client-side only fetching
- Use `server: false` to disable server-side fetching

### Server Routes and API
- Create API routes in `server/api/` directory
- Use `defineEventHandler` for route handlers
- Implement server middleware in `server/middleware/`
- Use `$fetch` for internal API calls
- Leverage Nitro's built-in utilities: `readBody`, `getQuery`, `setResponseStatus`
- Implement proper error handling with `createError`
- Use runtime config for server-side environment variables
- API Structure:
  - Public APIs: `server/api/*.get.ts` or `*.post.ts` (appointments, blog, services, etc.)
  - Admin APIs: `server/api/admin/**/*.ts` (protected by admin-auth middleware)
  - Server middleware: `server/middleware/admin-auth.ts` validates JWT for admin routes
  - Admin endpoints handle CRUD operations for content management
  - File uploads: `server/api/admin/upload.post.ts` handles image uploads to `public/uploads/`

### Database Operations
- Use `pg` (node-postgres) for PostgreSQL database operations
- Centralize database connection in `server/utils/db.ts`
- Use prepared statements (`?` placeholders, converted to `$1, $2, ...`) for SQL queries
- Initialize schema on first connection (`CREATE TABLE IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`)
- Connect via the `DATABASE_URL` environment variable
- Handle database errors gracefully

### Authentication
- Use Jose (JWT) for authentication tokens
- Store tokens in HTTP-only cookies, not localStorage
- Implement auth utilities in `server/utils/auth.ts`
- Create `useAdminAuth` composable for client-side auth state
- Use middleware for route protection
- Validate tokens on server-side for all protected routes
- Admin authentication:
  - Server-side: `server/middleware/admin-auth.ts` validates JWT on API routes
  - Client-side: `middleware/admin.ts` protects admin pages
  - Composable: `useAdminAuth()` manages auth state and logout
  - Layout: `layouts/admin.vue` for admin panel UI
  - Login: `pages/admin/login.vue` for authentication
  - API: `server/api/admin/login.post.ts` for login
  - API: `server/api/admin/logout.post.ts` for logout

### Styling
- Use CSS Variables defined in `assets/css/main.css` for theme colors
- Use `<style scoped>` for component-level styles
- Follow the project's naming conventions for CSS classes
- Implement mobile-first, responsive design with CSS Grid and Flexbox
- Use CSS custom properties from `:root` for consistency:
  - Colors: `--bg`, `--surface`, `--text`, `--primary`, `--gold`
  - Shadows: `--shadow`, `--shadow-md`, `--shadow-strong`
  - Radius: `--radius`, `--radius-sm`, `--radius-lg`
  - Container: `--container`
- Ensure styles are accessible (contrast, focus states)
- NO comments in style sections

### Font Management
- Project uses Aller font family
- Font weights: 300 (Light), 400 (Regular), 600/700 (Bold)
- Font styles: normal and italic variants
- Fonts are preloaded in `assets/css/main.css`
- Use `font-display: block` for consistent loading

### Performance Optimization
- Lazy-load components with `defineAsyncComponent` or Nuxt's `Lazy` prefix
- Use `<Suspense>` for async component loading fallbacks
- Apply `v-once` and `v-memo` for static or infrequently changing elements
- Profile with Vue DevTools Performance tab
- Avoid unnecessary watchers; prefer `computed` where possible
- Leverage Nuxt's auto-tree-shaking and code splitting
- Implement route-level code splitting automatically via pages
- Use `<ClientOnly>` for client-side only components
- Leverage Nuxt's payload extraction for faster hydration
- Optimize images in `public/uploads/` directory

### Error Handling
- Use Nuxt's error handling with `createError` and `showError`
- Create custom error page in `error.vue`
- Use `clearError` to programmatically clear errors
- Wrap risky logic in `try/catch`; provide user-friendly messages
- Use `errorCaptured` hook in components for local boundaries
- Display fallback UI or error alerts gracefully
- Log errors to external services if configured
- Use `onErrorCaptured` in composables

### Forms and Validation
- Build forms with controlled `v-model` bindings
- Validate on blur or input with debouncing for performance
- Handle file uploads with ImageUpload component
- Ensure accessible labeling, error announcements, and focus management
- Use custom components: AppSelect, AppDatePicker, AppTimePicker
- NO validation comments in code

### Routing (Nuxt)
- Use file-based routing in `pages/` directory
- Implement dynamic routes with `[id].vue` or `[slug].vue` syntax
- Use nested routes with directory structure
- Protect routes with middleware using `definePageMeta`
- Create global middleware in `middleware/` directory
- Use `navigateTo` for programmatic navigation
- Manage query params with `useRoute().query`
- Implement route validation in middleware
- Use `definePageMeta` for layout, middleware, and meta configuration
- Admin Panel Structure:
  - All admin routes under `pages/admin/` directory
  - Admin routes are client-side only (ssr: false in routeRules)
  - Admin layout: `layouts/admin.vue` with sidebar navigation
  - Admin middleware: `middleware/admin.ts` checks auth before page load
  - Admin pages: index, ayarlar, header, footer, hakkimda, iletisim, sss, blog, hizmet, randevular, sayfalar, talepler, notlar
  - Dynamic routes: `blog/[id].vue`, `hizmet/[slug].vue`, `randevular/[id].vue`
  - Login page exempt from auth middleware: `pages/admin/login.vue`

### Testing
- Write unit tests with Vue Test Utils and Vitest
- Focus on behavior, not implementation details
- Use `mount` and `shallowMount` for component isolation
- Mock Nuxt composables and auto-imports
- Add end-to-end tests with Cypress or Playwright
- Test accessibility using axe-core integration
- Use `@nuxt/test-utils` for Nuxt-specific testing

### Security
- Avoid using `v-html`; sanitize any HTML inputs rigorously
- Use CSP headers to mitigate XSS and injection attacks
- Validate and escape data in templates and directives
- Use HTTPS for all API requests
- Store sensitive tokens in HTTP-only cookies, not `localStorage`
- Use Nuxt's built-in CSRF protection
- Implement rate limiting on server routes
- Validate and sanitize all server-side inputs
- Use prepared statements for SQL queries to prevent injection

### Accessibility
- Use semantic HTML elements and ARIA attributes
- Manage focus for modals and dynamic content
- Provide keyboard navigation for interactive components
- Add meaningful `alt` text for images and icons
- Ensure color contrast meets WCAG AA standards
- Use `<NuxtLoadingIndicator>` for loading states
- Implement skip links for navigation

### SEO and Meta Management
- Use @nuxtjs/seo module for SEO optimization
- Use `useHead` for page-specific meta tags
- Use `useSeoMeta` for SEO optimization
- Implement Open Graph and Twitter Card meta tags
- Configure sitemap in `nuxt.config.ts`
- Use `robots.txt` configuration
- Implement structured data with JSON-LD
- Leverage server-side rendering for SEO benefits
- Configure site metadata in `nuxt.config.ts`

## Implementation Process
1. Initialize Nuxt 3 project with TypeScript
2. Plan component and composable architecture
3. Define type interfaces for props and state
4. Create layouts in `layouts/` directory
5. Set up pages with file-based routing
6. Create reusable composables in `composables/`
7. Build core UI components following structure rules
8. Implement server API routes in `server/api/`
9. Set up database schema and utilities
10. Integrate data fetching with `useFetch` and `useAsyncData`
11. Build forms with validation and error states
12. Add middleware for route protection and logic
13. Implement SEO and meta tag management
14. Add global error handling and error page
15. Add unit and E2E tests
16. Optimize performance and bundle size
17. Ensure accessibility compliance
18. Document components, composables, and stores (in separate docs)

## Additional Guidelines
- Follow Vue's official style guide (vuejs.org/style-guide)
- Follow Nuxt's official documentation (nuxt.com/docs)
- Use ESLint (with `@nuxtjs/eslint-config` and `plugin:vue/vue3-recommended`) and Prettier
- Write meaningful commit messages and maintain clean git history
- Keep dependencies up to date and audit for vulnerabilities
- Use TypeScript JSDoc/TSDoc only in separate documentation files
- Use Nuxt DevTools for debugging and profiling
- Leverage database migrations for schema changes

## Common Patterns
- Renderless components and scoped slots for flexible UI
- Compound components using provide/inject
- Custom directives for cross-cutting concerns
- Teleport for modals and overlays (see AppSelect component)
- Plugin system for global utilities
- Composable factories for parameterized logic
- Server-side utilities and helpers
- Middleware for authentication and authorization
- API layer abstraction in composables
- Type-safe environment configuration with `runtimeConfig`
- Toast notifications with useToast composable

## Code Quality Rules (MANDATORY)
1. NO comments anywhere in code (no `//`, no `/* */`, no `<!-- -->`)
2. Script tag MUST be first, template second, style third
3. Props can be defined inline with `defineProps<{}>()` for simple cases
4. Use TypeScript strict mode
5. Follow auto-import patterns for Nuxt
6. Use Nuxt's built-in composables over custom solutions
7. Implement proper error handling at every level
8. Ensure type safety throughout the application
9. Use CSS Variables from main.css for styling consistency
10. Use `pg` prepared statements for database queries
11. Use Jose (JWT) for authentication tokens
12. Store sensitive data in HTTP-only cookies only
