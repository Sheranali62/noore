import { prisma } from "@/lib/prisma"

export type StorefrontMedia = Record<string, string>

export async function getStorefrontMedia(): Promise<StorefrontMedia> {
  const setting = await prisma.setting.findUnique({ where: { key: "storefront_media" }, select: { value: true } })
  if (!setting?.value) return {}
  try {
    const parsed = JSON.parse(setting.value)
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as StorefrontMedia : {}
  } catch {
    return {}
  }
}

export function mediaImage(media: StorefrontMedia, key: string, fallback: string) {
  const value = media[key]
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}
