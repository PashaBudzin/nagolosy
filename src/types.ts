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
export type HistorySessionData = SessionBase<HistoryResult>
export type TermSessionData = SessionBase<TermResult>

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

export interface HistoryFact {
  date: string
  event: string
}

export interface HistoryResult {
  date: string
  event: string
  options: string[]
  selected: string | null
  correct: boolean
}

export interface HistoryStats extends StatsBase {
  date: string
  event: string
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

export interface TermResult {
  term: string
  definition: string
  options: string[]
  selected: string | null
  correct: boolean
}

export interface TermGroup {
  id: number
  name: string
  termIndices: number[]
}

export interface TermStats extends StatsBase {
  term: string
  definition: string
}

export interface HistorySubgroup {
  id: number
  name: string
  historyIndices: number[]
}

export interface HistoryGroup {
  id: number
  name: string
  historyIndices: number[]
  subgroups: HistorySubgroup[]
}

export interface VisualHistoryResult {
  imageUrl: string
  name: string
  category: string
  options: string[]
  selected: string | null
  correct: boolean
}

export type VisualHistorySessionData = SessionBase<VisualHistoryResult>

export interface VisualHistoryStats extends StatsBase {
  imageUrl: string
  name: string
  category: string
}
