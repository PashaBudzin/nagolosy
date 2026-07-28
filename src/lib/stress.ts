const UKRAINIAN_UPPER = new Set(
  "АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ".split("")
)

export interface ParsedWord {
  text: string
  stressIndices: number[]
  explanation?: string
}

export function parseWord(raw: string): ParsedWord {
  const explanation = raw.match(/\((.+?)\)/)?.[1]?.trim()
  const clean = raw.replace(/\(.*?\)/g, "").trim()

  const stressIndices: number[] = []
  const chars: string[] = []

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    if (UKRAINIAN_UPPER.has(ch)) {
      stressIndices.push(i)
    }
    chars.push(ch.toLowerCase())
  }

  if (
    stressIndices.length > 1 &&
    stressIndices[0] === 0
  ) {
    stressIndices.shift()
  }

  return { text: chars.join(""), stressIndices, explanation }
}

export function getWordData(raw: string): ParsedWord {
  return parseWord(raw)
}

const COMBINING_ACUTE = "\u0301"

export function displayWord(text: string, stressIndices: number[]): string {
  const chars = text.split("")
  for (const idx of stressIndices.sort((a, b) => b - a)) {
    chars.splice(idx + 1, 0, COMBINING_ACUTE)
  }
  return chars.join("")
}

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
