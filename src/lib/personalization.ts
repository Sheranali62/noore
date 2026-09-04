export type InterestSegment = "women" | "men" | "kids"

type InterestScores = Record<InterestSegment, number>

export const PERSONALIZATION_COOKIE = "noore_interest_v1"

export const emptyInterestScores = (): InterestScores => ({
  women: 0,
  men: 0,
  kids: 0,
})

function normalize(value: string | null | undefined) {
  return (value || "").trim().toLowerCase()
}

export function segmentFromValue(value: string | null | undefined): InterestSegment | null {
  const v = normalize(value)
  if (!v) return null
  if (/(^|[^a-z])(women|woman|female|ladies|lady)([^a-z]|$)/.test(v)) return "women"
  if (/(^|[^a-z])(men|man|male|mens|gentlemen|gents)([^a-z]|$)/.test(v)) return "men"
  if (/(^|[^a-z])(kids|kid|children|child|boys|girls|baby|babies|junior)([^a-z]|$)/.test(v)) return "kids"
  return null
}

export function scoreProductInterest(product: {
  gender?: string | null
  category?: string | null
  subcategory?: string | null
  type?: string | null
  tags?: string[]
  name?: string | null
}): InterestScores {
  const scores = emptyInterestScores()
  const direct = segmentFromValue(product.gender)
  if (direct) scores[direct] += 5

  const text = [product.category, product.subcategory, product.type, product.name, ...(product.tags || [])]
    .filter(Boolean)
    .join(" ")
  const inferred = segmentFromValue(text)
  if (inferred) scores[inferred] += 2

  return scores
}

export function getDominantInterest(scores: InterestScores): InterestSegment | null {
  const entries = Object.entries(scores) as [InterestSegment, number][]
  entries.sort((a, b) => b[1] - a[1])
  if (!entries[0] || entries[0][1] < 2) return null
  const [topSegment, topScore] = entries[0]
  const secondScore = entries[1]?.[1] || 0
  return topScore >= secondScore + 2 ? topSegment : null
}

export function getPersonalizedScore(product: {
  gender?: string | null
  category?: string | null
  subcategory?: string | null
  type?: string | null
  tags?: string[]
  name?: string | null
}, interest: InterestSegment | null) {
  if (!interest) return 0
  return scoreProductInterest(product)[interest]
}
