import { SignJWT, jwtVerify } from "jose"

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "ev-mobil-super-secret-key-change-in-production-2026"
)

export async function signToken(payload: Record<string, unknown>): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(SECRET)
}

export async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as Record<string, unknown>
  } catch {
    return null
  }
}

export function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {}
  return Object.fromEntries(
    cookieHeader.split(";").flatMap((c) => {
      const [k, ...v] = c.trim().split("=")
      if (!k) return []
      return [[k.trim(), decodeURIComponent(v.join("="))]]
    })
  )
}
