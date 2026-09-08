import { writeFile, mkdir } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { randomBytes } from 'node:crypto'

export default defineEventHandler(async (event) => {
  // Multipart form data oku
  const form = await readMultipartFormData(event)
  if (!form || form.length === 0) {
    throw createError({ statusCode: 400, message: 'Dosya bulunamadı.' })
  }

  const file = form[0]
  if (!file || !file.data) {
    throw createError({ statusCode: 400, message: 'Geçersiz dosya.' })
  }

  // Sadece resim kabul et
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
  const mime = file.type || 'application/octet-stream'
  if (!allowedMimes.includes(mime)) {
    throw createError({ statusCode: 415, message: 'Yalnızca resim dosyaları (jpg, png, webp, gif, svg) kabul edilir.' })
  }

  // Max 5 MB
  if (file.data.length > 5 * 1024 * 1024) {
    throw createError({ statusCode: 413, message: 'Dosya boyutu 5 MB\'ı aşamaz.' })
  }

  // Uzantı belirle
  const extMap: Record<string, string> = {
    'image/jpeg':   '.jpg',
    'image/png':    '.png',
    'image/webp':   '.webp',
    'image/gif':    '.gif',
    'image/svg+xml': '.svg',
  }
  const ext = extMap[mime] || extname(file.filename || '.jpg') || '.jpg'

  // Benzersiz dosya adı
  const filename = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`

  // Upload dizini (Docker'da env ile sabitlenebilir)
  const uploadDir = process.env.UPLOADS_DIR || join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadDir, { recursive: true })

  const filePath = join(uploadDir, filename)
  await writeFile(filePath, file.data)

  return { url: `/uploads/${filename}` }
})
