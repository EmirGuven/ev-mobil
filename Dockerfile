# ─────────────────────────────────────────────
# Stage 1 — Builder
# ─────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# Önce sadece bağımlılıkları kopyala (cache için)
COPY package*.json ./
RUN npm ci

# Kaynak kodun tamamını kopyala
COPY . .

# Nuxt production build
RUN npm run build


# ─────────────────────────────────────────────
# Stage 2 — Runner (minimal imaj)
# ─────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

# Build çıktısını kopyala
COPY --from=builder /app/.output ./.output

# Kalıcı veri dizini (yüklenen dosyalar için volume mount noktası)
RUN mkdir -p /app/public/uploads

# Uygulama portu
EXPOSE 3000

# Ortam değişkenleri (docker-compose veya -e ile override edilir)
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

CMD ["node", ".output/server/index.mjs"]
