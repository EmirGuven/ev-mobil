export const defaultThemePaletteId = "gold"

export type ThemePaletteId = "gold" | "ocean" | "forest" | "terra" | "redline"

type ThemePalette = {
  id: ThemePaletteId
  label: string
  description: string
  preview: [string, string, string]
  colors: ThemeColors
}

export type ThemeColors = {
  primary: string
  primaryMid: string
  primaryLight: string
  primaryDeep: string
  primarySoft: string
  primarySoftMid: string
  gold: string
  goldLight: string
  goldSoft: string
  surfaceDark: string
  accentContrast: string
}

export type CustomThemeInput = {
  primary?: string
  primaryDeep?: string
  surfaceDark?: string
  accentContrast?: string
}

export const themePalettes: ThemePalette[] = [
  {
    id: "gold",
    label: "Altın",
    description: "Mevcut sıcak ve kurumsal görünüm.",
    preview: ["#9a7030", "#c9a35a", "#f0d9ab"],
    colors: {
      primary: "#c9a35a",
      primaryMid: "#dbb978",
      primaryLight: "#f0d9ab",
      primaryDeep: "#9a7030",
      primarySoft: "rgba(201,163,90,0.08)",
      primarySoftMid: "rgba(201,163,90,0.16)",
      gold: "#c9a35a",
      goldLight: "#e2c07d",
      goldSoft: "rgba(201,163,90,0.10)",
      surfaceDark: "#2a3347",
      accentContrast: "#1a1209",
    },
  },
  {
    id: "ocean",
    label: "Okyanus",
    description: "Daha serin ve kurumsal mavi tonlar.",
    preview: ["#1b5a78", "#2f7ea1", "#b9dcec"],
    colors: {
      primary: "#2f7ea1",
      primaryMid: "#4e9cc0",
      primaryLight: "#b9dcec",
      primaryDeep: "#1b5a78",
      primarySoft: "rgba(47,126,161,0.08)",
      primarySoftMid: "rgba(47,126,161,0.16)",
      gold: "#2f7ea1",
      goldLight: "#6ab3d2",
      goldSoft: "rgba(47,126,161,0.10)",
      surfaceDark: "#1f3543",
      accentContrast: "#ffffff",
    },
  },
  {
    id: "forest",
    label: "Orman",
    description: "Güven veren koyu yeşil vurgu.",
    preview: ["#2a624d", "#3d8b6d", "#c5e4d6"],
    colors: {
      primary: "#3d8b6d",
      primaryMid: "#5faa89",
      primaryLight: "#c5e4d6",
      primaryDeep: "#2a624d",
      primarySoft: "rgba(61,139,109,0.08)",
      primarySoftMid: "rgba(61,139,109,0.16)",
      gold: "#3d8b6d",
      goldLight: "#7fc2a4",
      goldSoft: "rgba(61,139,109,0.10)",
      surfaceDark: "#22382f",
      accentContrast: "#ffffff",
    },
  },
  {
    id: "terra",
    label: "Toprak",
    description: "Daha sıcak ve operasyonel bir vurgu.",
    preview: ["#8c4628", "#c46c47", "#f2cfbf"],
    colors: {
      primary: "#c46c47",
      primaryMid: "#d98a68",
      primaryLight: "#f2cfbf",
      primaryDeep: "#8c4628",
      primarySoft: "rgba(196,108,71,0.08)",
      primarySoftMid: "rgba(196,108,71,0.16)",
      gold: "#c46c47",
      goldLight: "#e3a285",
      goldSoft: "rgba(196,108,71,0.10)",
      surfaceDark: "#3a261f",
      accentContrast: "#ffffff",
    },
  },
  {
    id: "redline",
    label: "Kirmizi / Siyah / Beyaz",
    description: "Daha sert, kontrastli ve dikkat cekici gorunum.",
    preview: ["#111111", "#c62828", "#f5f5f5"],
    colors: {
      primary: "#c62828",
      primaryMid: "#e53935",
      primaryLight: "#f4c7c7",
      primaryDeep: "#8f1d1d",
      primarySoft: "rgba(198,40,40,0.08)",
      primarySoftMid: "rgba(198,40,40,0.16)",
      gold: "#c62828",
      goldLight: "#ef5350",
      goldSoft: "rgba(198,40,40,0.10)",
      surfaceDark: "#111111",
      accentContrast: "#ffffff",
    },
  },
]

const fallbackThemePalette = themePalettes.find((palette) => palette.id === defaultThemePaletteId) || themePalettes[0]!

const HEX_COLOR_REGEX = /^#[0-9a-f]{6}$/i

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function hexToRgb(hex: string) {
  const normalized = hex.replace("#", "")
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  }
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((part) => clamp(Math.round(part), 0, 255).toString(16).padStart(2, "0"))
    .join("")}`
}

function mixHex(baseHex: string, targetHex: string, weight: number) {
  const base = hexToRgb(baseHex)
  const target = hexToRgb(targetHex)
  const w = clamp(weight, 0, 1)
  return rgbToHex(
    base.r + (target.r - base.r) * w,
    base.g + (target.g - base.g) * w,
    base.b + (target.b - base.b) * w,
  )
}

function withAlpha(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex)
  const safeAlpha = clamp(alpha, 0, 1)
  return `rgba(${r},${g},${b},${safeAlpha})`
}

function safeHexColor(value: string | undefined, fallback: string) {
  const normalized = String(value || "").trim().toLowerCase()
  if (HEX_COLOR_REGEX.test(normalized)) return normalized
  return fallback
}

export function buildCustomThemeColors(input: CustomThemeInput = {}): ThemeColors {
  const fallback = fallbackThemePalette.colors
  const primary = safeHexColor(input.primary, fallback.primary)
  const primaryDeep = safeHexColor(input.primaryDeep, fallback.primaryDeep)
  const surfaceDark = safeHexColor(input.surfaceDark, fallback.surfaceDark)
  const accentContrast = safeHexColor(input.accentContrast, fallback.accentContrast)

  return {
    primary,
    primaryMid: mixHex(primary, "#ffffff", 0.18),
    primaryLight: mixHex(primary, "#ffffff", 0.52),
    primaryDeep,
    primarySoft: withAlpha(primary, 0.08),
    primarySoftMid: withAlpha(primary, 0.16),
    gold: primary,
    goldLight: mixHex(primary, "#ffffff", 0.3),
    goldSoft: withAlpha(primary, 0.1),
    surfaceDark,
    accentContrast,
  }
}

export function resolveThemePalette(id?: string) {
  return themePalettes.find((palette) => palette.id === id) || fallbackThemePalette
}

export function buildThemeCssVariables(id?: string) {
  const palette = resolveThemePalette(id)
  return `
:root {
  --primary: ${palette.colors.primary};
  --primary-mid: ${palette.colors.primaryMid};
  --primary-light: ${palette.colors.primaryLight};
  --primary-deep: ${palette.colors.primaryDeep};
  --primary-soft: ${palette.colors.primarySoft};
  --primary-soft-mid: ${palette.colors.primarySoftMid};
  --gold: ${palette.colors.gold};
  --gold-light: ${palette.colors.goldLight};
  --gold-soft: ${palette.colors.goldSoft};
  --surface-dark: ${palette.colors.surfaceDark};
  --accent-contrast: ${palette.colors.accentContrast};
}
  `.trim()
}
