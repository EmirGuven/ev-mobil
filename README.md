# Nuxt SEO Nakliyat Sitesi

Bu proje Nuxt tabanli, SSR acik ve SEO modulleri hazir bir Nakliyat sitesi iskeletidir.

## Ozellikler

- Nuxt SSR ile sunucu tarafinda render
- `@nuxtjs/seo` ile `robots.txt`, `sitemap.xml`, canonical ve teknik SEO altyapisi
- Sayfa bazli `useSeoMeta()` kullanimi
- JSON-LD schema icin `useSchemaOrg()`
- Mobil uyumlu Vue bilesenleri

## Kurulum

Bagimliliklari kurun:

```bash
npm install
```

Gelistirme sunucusunu baslatin:

```bash
npm run dev
```

Uretim onizleme:

```bash
npm run build
npm run preview
```

## Production Persistence & Backup

Veritabani PostgreSQL'dir (ayri bir Docker servisi/container olarak calisir, `DATABASE_URL` ile baglanilir). Yuklenen dosyalar icin bind mount kullanilir.

- Uploads container yolu: `/app/public/uploads`
- Host uploads klasoru: `/data/gozdenakliyat-web/uploads`

`docker-compose.yml` icinde bu klasor asagidaki gibi baglanir:

```yaml
volumes:
	- ${APP_UPLOADS_DIR:-/data/gozdenakliyat-web/uploads}:/app/public/uploads
```

PostgreSQL baglantisi `.env` icindeki `DATABASE_URL` degiskeni ile yapilir (format: `postgresql://kullanici:sifre@host:5432/veritabani`). Postgres container'i ayri calisiyorsa, web servisinin onun bulundugu Docker network'une de bagli olmasi gerekir (bkz. `docker-compose.yml` `networks` bolumu).

### Sunucu ilk kurulum

1. Proxy network yoksa olusturun:

```bash
docker network create proxy
```

2. Kalici host klasorunu olusturun:

```bash
mkdir -p /data/gozdenakliyat-web/uploads
```

3. Klasor sahiplik/izin ayari yapin (ortama gore root veya docker kullanicisi):

```bash
chown -R 1000:1000 /data/gozdenakliyat-web
chmod -R 775 /data/gozdenakliyat-web
```

4. `.env` dosyasini hazirlayin (`docker-compose.yml` ile ayni dizinde):

```env
ADMIN_JWT_SECRET=<uzun-ve-guclu-bir-deger>
NUXT_PUBLIC_SITE_URL=https://gozdenakliyat.com.tr
APP_UPLOADS_DIR=/data/gozdenakliyat-web/uploads
DATABASE_URL=postgresql://kullanici:sifre@host:5432/veritabani
```

### Deploy / Upgrade runbook

1. Yeni surumu build ederek ayaga kaldirin:

```bash
docker compose up -d --build
```

2. Saglik kontrolu:

```bash
docker compose ps
curl -f http://127.0.0.1:3000/api/health
```

3. Traefik + HTTPS dogrulamasi:

```bash
curl -I https://gozdenakliyat.com.tr
curl -I https://www.gozdenakliyat.com.tr
```

4. Kalicilik smoke testi (recreate sonrasi):

- Admin panelden test bir kayit olusturun (ornek not/randevu)
- Bir gorsel yukleyin
- `docker compose down` ve sonra `docker compose up -d`
- Kayit ve gorselin korundugunu dogrulayin

Sunucu tarafinda veri kaybini onlemek icin kritik kurallar:

- Uygulamayi guncellerken `docker compose down -v` kullanmayin (`-v` volume verisini siler).
- `.env` icindeki `APP_UPLOADS_DIR` ve `DATABASE_URL` degerleri sabit kalmali, her deployda degismemeli.
- Host klasoru deploy oncesi var olmali. Compose dosyasi `create_host_path: false` ile calistigi icin klasor yoksa bilerek hata verir.
- Onerilen kalici sunucu yolu:
	- `/data/gozdenakliyat-web/uploads`
- PostgreSQL verisi ayri Postgres container'inin kendi volume'unde tutulur; onun yedekleme/kalicilik ayarlari bu projeden bagimsiz yonetilir.

### Backup plani

Gunluk yedek hedefi:

- PostgreSQL DB: `pg_dump` ile
- Uploads: `/data/gozdenakliyat-web/uploads`

Ornek yedek scripti:

```bash
#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d-%H%M%S)"
BACKUP_ROOT="/data/backups/gozdenakliyat-web"
UPLOADS_SRC="/data/gozdenakliyat-web/uploads"

mkdir -p "$BACKUP_ROOT"
pg_dump "$DATABASE_URL" -F c -f "$BACKUP_ROOT/app-$TS.dump"
tar -czf "$BACKUP_ROOT/uploads-$TS.tar.gz" -C "$UPLOADS_SRC" .

# 14 gunden eski yedekleri temizle
find "$BACKUP_ROOT" -type f -mtime +14 -delete
```

Cron ornegi (her gun 03:30):

```bash
30 3 * * * /usr/local/bin/gozde-backup.sh >> /var/log/gozde-backup.log 2>&1
```

### Restore ve rollback

1. Uygulamayi durdurun:

```bash
docker compose down
```

2. DB ve uploads geri yukleyin:

```bash
pg_restore -d "$DATABASE_URL" --clean --if-exists /data/backups/gozdenakliyat-web/app-YYYYMMDD-HHMMSS.dump
rm -rf /data/gozdenakliyat-web/uploads/*
tar -xzf /data/backups/gozdenakliyat-web/uploads-YYYYMMDD-HHMMSS.tar.gz -C /data/gozdenakliyat-web/uploads
```

3. Servisi tekrar baslatin ve health kontrolu yapin:

```bash
docker compose up -d
curl -f http://127.0.0.1:3000/api/health
```

### Final checklist

- `docker compose config` hatasiz calisiyor
- `docker compose ps` durumlari saglikli
- API health endpoint `200` donuyor
- Upload testi basarili
- Container recreate sonrasi veri korunuyor
- Yedekten test restore basarili

## Ozellestirme

- Isletme ve iletisim bilgilerini `data/site.ts` dosyasindan degistirin.
- Gercek domaininizi `.env` veya `NUXT_PUBLIC_SITE_URL` ile verin.
- Sayfa metinlerini `pages/` klasorunde duzenleyin.
- Tasarimi `assets/css/main.css` uzerinden gelistirin.
