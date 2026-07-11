/** Classic Levenshtein edit distance between two strings. */
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = new Array(n + 1)
  for (let j = 0; j <= n; j++) dp[j] = j
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j]
      dp[j] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, dp[j], dp[j - 1])
      prev = tmp
    }
  }
  return dp[n]
}

/** How many typos to tolerate for a word of the given length. */
function toleranceFor(len: number): number {
  if (len <= 3) return 0
  if (len <= 6) return 1
  return 2
}

/**
 * True if `query` approximately appears in `text` — tolerates small typos
 * (e.g. "wadrobe" matches "wardrobe") in addition to exact substrings.
 */
export function fuzzyIncludes(text: string, query: string): boolean {
  const t = text.toLowerCase()
  const q = query.toLowerCase().trim()
  if (!q) return true
  if (t.includes(q)) return true

  const queryWords = q.split(/\s+/).filter(Boolean)
  const textWords = t.split(/[^a-z0-9]+/).filter(Boolean)

  return queryWords.every((qw) => {
    if (t.includes(qw)) return true
    const tolerance = toleranceFor(qw.length)
    return textWords.some((tw) => levenshtein(qw, tw) <= tolerance)
  })
}

/** Fuzzy-filters a list of records by testing `query` against the given text fields. */
export function fuzzyFilter<T>(items: T[], query: string, getFields: (item: T) => (string | null | undefined)[]): T[] {
  return items.filter((item) => {
    const haystack = getFields(item).filter(Boolean).join(" ")
    return fuzzyIncludes(haystack, query)
  })
}
