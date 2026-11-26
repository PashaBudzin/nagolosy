import { IDIOMS_RAW } from "@/data/idioms"
import { shuffleArray } from "@/lib/stress"

const SEPARATOR = "–"

export interface ParsedIdiom {
  idiom: string
  definition: string
}

export function parseIdiom(raw: string): ParsedIdiom {
  const sepIndex = raw.indexOf(SEPARATOR)
  if (sepIndex === -1) {
    return { idiom: raw.trim(), definition: "" }
  }
  return {
    idiom: raw.slice(0, sepIndex).trim(),
    definition: raw.slice(sepIndex + SEPARATOR.length).trim(),
  }
}

export const IDIOM_ENTRIES: ParsedIdiom[] = IDIOMS_RAW.map(parseIdiom)

const UNIQUE_DEFINITIONS = Array.from(
  new Set(IDIOM_ENTRIES.map((entry) => entry.definition))
)

export function buildQuizOptions(
  correctDefinition: string,
  count = 4
): string[] {
  const distractors = shuffleArray(
    UNIQUE_DEFINITIONS.filter((d) => d !== correctDefinition)
  ).slice(0, count - 1)
  return shuffleArray([correctDefinition, ...distractors])
}
