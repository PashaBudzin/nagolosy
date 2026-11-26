import { HISTORY_FACTS } from "@/data/history"
import { shuffleArray } from "@/lib/stress"

export interface ParsedHistoryFact {
  date: string
  event: string
}

export const HISTORY_ENTRIES: ParsedHistoryFact[] = HISTORY_FACTS

const MONTH_FRACTION: Record<string, number> = {
  січень: 0,
  січня: 0,
  лютий: 0.08,
  лютого: 0.08,
  березень: 0.17,
  березня: 0.17,
  квітень: 0.25,
  квітня: 0.25,
  травень: 0.33,
  травня: 0.33,
  червень: 0.42,
  червня: 0.42,
  липень: 0.5,
  липня: 0.5,
  серпень: 0.58,
  серпня: 0.58,
  вересень: 0.67,
  вересня: 0.67,
  жовтень: 0.75,
  жовтня: 0.75,
  листопад: 0.83,
  листопада: 0.83,
  грудень: 0.92,
  грудня: 0.92,
}

const ROMAN_NUMERALS: Record<string, number> = {
  I: 1,
  V: 5,
  X: 10,
  L: 50,
  C: 100,
  D: 500,
  M: 1000,
}

function normalizeRoman(s: string): string {
  return s.replace(/І/g, "I").replace(/Х/g, "X")
}

function romanToInt(s: string): number | null {
  let total = 0
  for (let i = 0; i < s.length; i++) {
    const v = ROMAN_NUMERALS[s[i]]
    if (v === undefined) return null
    const next = ROMAN_NUMERALS[s[i + 1]] ?? 0
    total += v < next ? -v : v
  }
  return total
}

function extractCenturies(s: string): number[] {
  const normalized = normalizeRoman(s)
  const result: number[] = []
  const romanPattern = /[IVXLCDM]+/g
  let match: RegExpExecArray | null
  while ((match = romanPattern.exec(normalized)) !== null) {
    const value = romanToInt(match[0])
    if (value !== null && value >= 1 && value <= 30) {
      result.push(value)
    }
  }
  return result
}

function extractYears(s: string): number[] {
  const result: number[] = []
  const match = s.match(/\d{3,4}/g)
  if (match) {
    for (const y of match) {
      const num = Number(y)
      if (num >= 100) result.push(num)
    }
  }
  return result
}

const MONTH_PATTERN = new RegExp(
  Object.keys(MONTH_FRACTION)
    .sort((a, b) => b.length - a.length)
    .join("|"),
  "g"
)

function averageMonth(s: string): number | null {
  const found: number[] = []
  let match: RegExpExecArray | null
  while ((match = MONTH_PATTERN.exec(s)) !== null) {
    found.push(MONTH_FRACTION[match[0]])
  }
  if (found.length === 0) return null
  return found.reduce((a, b) => a + b, 0) / found.length
}

export function dateEpoch(dateStr: string): number | null {
  const s = dateStr.trim()
  if (s.length === 0) return null
  if (s.includes("млн років тому")) return -1_000_000

  const isBC = s.includes("до н. е.")

  if (s.includes("тис.")) {
    const centuries = extractCenturies(s)
    if (centuries.length > 0) {
      const center = (Math.min(...centuries) + Math.max(...centuries)) / 2
      return -center * 1000
    }
  }

  if (s.includes("ст.")) {
    const centuries = extractCenturies(s)
    if (centuries.length > 0) {
      const center = (Math.min(...centuries) + Math.max(...centuries)) / 2
      const year = center * 100 - 50
      return isBC ? -year : year
    }
  }

  const years = extractYears(s)
  if (years.length === 0) {
    const decade = s.match(/(\d{3,4})\s*(?:-х|-ті|-і)\b/)
    if (decade) return Number(decade[1])
    return null
  }

  const month = averageMonth(s) ?? 0

  if (years.length === 1) {
    const year = years[0] + month
    return isBC ? -year : year
  }

  const center = (Math.min(...years) + Math.max(...years)) / 2 + month
  return isBC ? -center : center
}

const UNIQUE_DATES = Array.from(
  new Set(HISTORY_ENTRIES.map((entry) => entry.date))
).map((date) => ({ date, epoch: dateEpoch(date) }))

export function buildHistoryQuizOptions(
  correctDate: string,
  count = 4
): string[] {
  const candidates = UNIQUE_DATES.filter((d) => d.date !== correctDate)

  const sorted = candidates
    .filter((d) => d.epoch !== null)
    .sort((a, b) => {
      const correct = dateEpoch(correctDate) ?? 0
      const da = Math.abs((a.epoch as number) - correct)
      const db = Math.abs((b.epoch as number) - correct)
      return da - db
    })
    .map((d) => d.date)

  const distractorPool = shuffleArray(sorted.slice(0, 8))
  const distractors = distractorPool.slice(0, count - 1)

  return shuffleArray([correctDate, ...distractors])
}
