const UKRAINIAN_UPPER = new Set(
  "АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ".split("")
)

export interface ParsedWord {
  text: string
  stressIndices: number[]
}

export function parseWord(raw: string): ParsedWord {
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

  return { text: chars.join(""), stressIndices }
}

export function getWordData(raw: string): ParsedWord {
  return parseWord(raw)
}

export function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
