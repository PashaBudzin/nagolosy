export interface WordResult {
  word: string
  stressIndices: number[]
  correct: boolean
  explanation?: string
}

export interface SessionBase<TResult> {
  id: string
  timestamp: number
  groupId: number
  results: TResult[]
  durationMs: number
}

export type SessionData = SessionBase<WordResult>
export type IdiomSessionData = SessionBase<IdiomResult>

export interface HistoryEntry {
  correct: boolean
  timestamp: number
  sessionId: string
}

export interface StatsBase {
  total: number
  correct: number
  history: HistoryEntry[]
}

export interface WordStats extends StatsBase {
  word: string
  stressIndices: number[]
  explanation?: string
}

export interface IdiomStats extends StatsBase {
  idiom: string
  definition: string
}

export interface Group {
  id: number
  name: string
  wordIndices: number[]
}

export interface IdiomResult {
  idiom: string
  definition: string
  options: string[]
  selected: string | null
  correct: boolean
}

export interface IdiomGroup {
  id: number
  name: string
  idiomIndices: number[]
}
