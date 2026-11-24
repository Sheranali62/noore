export type HomepageDesign = {
  backgroundColor: string
  textColor: string
  accentColor: string
  buttonColor: string
  buttonTextColor: string
  surfaceColor: string
  mutedTextColor: string
  borderColor: string
  headerColor: string
  headerTextColor: string
  footerColor: string
  footerTextColor: string
  announcementColor: string
  announcementTextColor: string
  bodyFont: "sans" | "serif"
  announcementMessage: string
  footerDescription: string
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
  limitedEyebrow: string
  limitedHeading: string
  limitedDescription: string
  saleEyebrow: string
  saleHeading: string
  saleDescription: string
  storiesEyebrow: string
  storiesHeading: string
  journalEyebrow: string
  journalHeading: string
  brandEyebrow: string
  brandHeading: string
  brandDescription: string
  brandButtonText: string
  brandButtonUrl: string
  newsletterEyebrow: string
  newsletterHeading: string
  newsletterDescription: string
  newsletterButtonText: string
  newsletterButtonUrl: string
}
export const DEFAULT_HOMEPAGE_DESIGN: HomepageDesign = {
  backgroundColor: "#F7F6F2",
  textColor: "#30352E",
  accentColor: "#535F4C",
  buttonColor: "#535F4C",
  buttonTextColor: "#FFFFFF",
  surfaceColor: "#FFFFFF",
  mutedTextColor: "#77786F",
  borderColor: "#DEDCD3",
  headerColor: "#F7F6F2",
  headerTextColor: "#30352E",
  footerColor: "#535F4C",
  footerTextColor: "#F7F6F2",
  announcementColor: "#535F4C",
  announcementTextColor: "#FFFFFF",
  bodyFont: "sans",
  announcementMessage: "FREE SHIPPING ON ORDERS ABOVE PKR 5,000",
  footerDescription: "Thoughtful style, considered details and modern essentials. Discover the NOORÉ edit and find pieces made to feel like your own.",
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
  limitedEyebrow: "Limited quantities",
  limitedHeading: "Almost gone",
  limitedDescription: "The pieces customers are reaching for now.",
  saleEyebrow: "The price edit",
  saleHeading: "Selected on sale",
  saleDescription: "A considered selection, available while it lasts.",
  storiesEyebrow: "Curated stories",
  storiesHeading: "The collections",
  journalEyebrow: "From the journal",
  journalHeading: "The NOORÉ journal",
  brandEyebrow: "Our point of view",
  brandHeading: "A little more you. A little more NOORÉ.",
  brandDescription: "We bring together heritage, modern silhouettes and thoughtful details to create pieces that feel relevant today and beautiful for years to come.",
  brandButtonText: "Discover NOORÉ",
  brandButtonUrl: "/products",
  newsletterEyebrow: "Stay in the know",
  newsletterHeading: "A little more NOORÉ.",
  newsletterDescription: "Be first to discover new collections, exclusive edits and private offers.",
  newsletterButtonText: "Explore the collection",
  newsletterButtonUrl: "/products",
}
const hex = /^#[0-9a-fA-F]{6}$/
export function normalizeHomepageDesign(input: unknown): HomepageDesign {
  const value = input && typeof input === "object" ? input as Record<string, unknown> : {}
  const result = { ...DEFAULT_HOMEPAGE_DESIGN }
  for (const key of Object.keys(result) as (keyof HomepageDesign)[]) {
    const candidate = value[key]
    if (typeof candidate === "string" && candidate.trim()) {
      if (["backgroundColor", "textColor", "accentColor", "buttonColor", "buttonTextColor", "surfaceColor", "mutedTextColor", "borderColor", "headerColor", "headerTextColor", "footerColor", "footerTextColor", "announcementColor", "announcementTextColor"].includes(key)) {
        if (hex.test(candidate)) (result as any)[key] = candidate
      } else if (key === "headingFont") {
        if (["editorial", "serif", "sans"].includes(candidate)) result.headingFont = candidate as HomepageDesign["headingFont"]
      } else if (key === "bodyFont") { if (["sans", "serif"].includes(candidate)) result.bodyFont = candidate as HomepageDesign["bodyFont"]
      } else if (key.endsWith("Url")) {
        const url = candidate.trim()
        if (url.length <= 180 && ((url.startsWith("/") && !url.startsWith("//")) || url.toLowerCase().startsWith("https://"))) (result as any)[key] = url
      } else if (candidate.length <= 500) (result as any)[key] = candidate.trim()
    }
  }
  return result
}
