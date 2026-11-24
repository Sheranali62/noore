export type HomepageDesign = {
  backgroundColor: string
  textColor: string
  accentColor: string
  buttonColor: string
  buttonTextColor: string
  headingFont: "editorial" | "serif" | "sans"
  heroEyebrow: string
  heroKicker: string
  heroHeading: string
  heroDescription: string
  primaryButtonText: string
  primaryButtonUrl: string
  secondaryButtonText: string
  secondaryButtonUrl: string
  collectionsEyebrow: string
  collectionsHeading: string
  favouritesEyebrow: string
  favouritesHeading: string
  categoriesEyebrow: string
  categoriesHeading: string
  arrivalsEyebrow: string
  arrivalsHeading: string
  luxuryEyebrow: string
  luxuryHeading: string
  luxuryDescription: string
  luxuryButtonText: string
  luxuryButtonUrl: string
}
export const DEFAULT_HOMEPAGE_DESIGN: HomepageDesign = {
  backgroundColor: "#F7F6F2",
  textColor: "#30352E",
  accentColor: "#535F4C",
  buttonColor: "#535F4C",
  buttonTextColor: "#FFFFFF",
  headingFont: "editorial",
  heroEyebrow: "NOORÉ — New Season",
  heroKicker: "A world of considered style",
  heroHeading: "Wear your own light.",
  heroDescription: "Discover the NOORÉ collection: modern fashion, thoughtful details and timeless pieces for every version of you.",
  primaryButtonText: "Discover NOORÉ",
  primaryButtonUrl: "/products",
  secondaryButtonText: "The Luxury Edit",
  secondaryButtonUrl: "/products?category=Luxury",
  collectionsEyebrow: "The NOORÉ collections",
  collectionsHeading: "Shop by world",
  favouritesEyebrow: "Customer favourites",
  favouritesHeading: "The pieces they love",
  categoriesEyebrow: "Discover",
  categoriesHeading: "Shop by category",
  arrivalsEyebrow: "Fresh from NOORÉ",
  arrivalsHeading: "New arrivals",
  luxuryEyebrow: "The luxury edit",
  luxuryHeading: "For evenings that deserve more.",
  luxuryDescription: "A refined selection of elevated pieces, occasion silhouettes and considered details designed to make an entrance without asking for attention.",
  luxuryButtonText: "Explore the luxury edit",
  luxuryButtonUrl: "/collections",
}
const hex = /^#[0-9a-fA-F]{6}$/
export function normalizeHomepageDesign(input: unknown): HomepageDesign {
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {}
  const result = { ...DEFAULT_HOMEPAGE_DESIGN }
  for (const key of Object.keys(result) as (keyof HomepageDesign)[]) {
    const candidate = value[key]
    if (typeof candidate === "string" && candidate.trim()) {
      if (["backgroundColor", "textColor", "accentColor", "buttonColor", "buttonTextColor"].includes(key)) {
        if (hex.test(candidate)) (result as any)[key] = candidate
      } else if (key === "headingFont") {
        if (["editorial", "serif", "sans"].includes(candidate)) result.headingFont = candidate as HomepageDesign["headingFont"]
      } else if (candidate.length <= 180) (result as any)[key] = candidate.trim()
    }
  }
  return result
}
