import { access, stat } from "node:fs/promises"
import { createReadStream } from "node:fs"
import { join, normalize } from "node:path"

const contentTypeByExt: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
}

export default defineEventHandler(async (event) => {
  const requested = getRouterParam(event, "path") || ""
  const decoded = decodeURIComponent(requested)

  const uploadsRoot = process.env.UPLOADS_DIR || join(process.cwd(), "public", "uploads")
  const absoluteRoot = normalize(uploadsRoot)
  const absoluteFile = normalize(join(absoluteRoot, decoded))

  if (!absoluteFile.startsWith(absoluteRoot)) {
    throw createError({ statusCode: 400, message: "Geçersiz dosya yolu." })
  }

  try {
    await access(absoluteFile)
    const fileStat = await stat(absoluteFile)
    if (!fileStat.isFile()) {
      throw createError({ statusCode: 404, message: "Dosya bulunamadı." })
    }
  } catch {
    throw createError({ statusCode: 404, message: "Dosya bulunamadı." })
  }

  const ext = absoluteFile.slice(absoluteFile.lastIndexOf(".")).toLowerCase()
  const contentType = contentTypeByExt[ext] || "application/octet-stream"

  setHeader(event, "Content-Type", contentType)
  setHeader(event, "Cache-Control", "public, max-age=31536000, immutable")

  return sendStream(event, createReadStream(absoluteFile))
})