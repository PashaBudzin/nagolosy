export interface WordResult {
  word: string
  stressIndices: number[]
  correct: boolean
  explanation?: string
}

export interface SessionData {
  id: string
  timestamp: number
  groupId: number
  results: WordResult[]
  durationMs: number
}

export interface WordHistoryEntry {
  correct: boolean
  timestamp: number
  sessionId: string
}

export interface WordStats {
  word: string
  stressIndices: number[]
  explanation?: string
  total: number
  correct: number
  history: WordHistoryEntry[]
}

export interface Group {
  id: number
  name: string
  wordIndices: number[]
}
