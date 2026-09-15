import { TERMS_RAW } from "@/data/terms"
import type { MatchItem } from "@/lib/match"

const SEPARATOR = "–"

export function parseTerm(raw: string): MatchItem {
  const sepIndex = raw.indexOf(SEPARATOR)
  if (sepIndex === -1) {
    return { item: raw.trim(), definition: "" }
  }
  return {
    item: raw.slice(0, sepIndex).trim(),
    definition: raw.slice(sepIndex + SEPARATOR.length).trim(),
  }
}

export const TERM_ENTRIES: MatchItem[] = TERMS_RAW.map(parseTerm)
