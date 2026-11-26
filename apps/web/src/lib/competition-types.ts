/**
 * Web copy of the group-competition wire protocol. The server copy lives in
 * `apps/server/src/protocol.ts` — keep the two files in sync.
 */

export type CompetitionCategory = "words" | "idioms" | "history" | "terms"

export interface CompetitionConfig {
  category: CompetitionCategory
  /** `"all"` or an id from the category's group list. */
  groupId: number | "all"
  questionCount: number
  timePerQuestionMs: number
}

export interface CompetitionQuestion {
  prompt: string
  hint?: string
  options: string[]
  correctIndex: number
}

export type CompetitionPhase = "lobby" | "playing" | "reveal" | "finished"

export interface CompetitionPlayer {
  id: string
  name: string
  score: number
  correct: number
  totalTimeMs: number
  connected: boolean
}

export interface CompetitionQuestionPayload {
  index: number
  total: number
  prompt: string
  hint?: string
  options: string[]
  timeLimitMs: number
  remainingMs: number
}

export interface CompetitionAnswer {
  playerId: string
  name: string
  selected: number | null
  correct: boolean
  delta: number
  timeMs: number | null
}

export interface LeaderboardEntry {
  playerId: string
  name: string
  score: number
  correct: number
  totalTimeMs: number
  connected: boolean
}

export interface CompetitionReveal {
  index: number
  total: number
  correctIndex: number
  correctText: string
  answers: CompetitionAnswer[]
  leaderboard: LeaderboardEntry[]
  nextInMs: number
}

export interface CompetitionResult {
  totalQuestions: number
  leaderboard: LeaderboardEntry[]
}

export type ClientMessage =
  | { type: "create"; name: string; config?: Partial<CompetitionConfig> }
  | { type: "join"; code: string; name: string }
  | { type: "rejoin"; code: string; token: string }
  | { type: "leave" }
  | { type: "updateConfig"; config: Partial<CompetitionConfig> }
  | { type: "start"; questions: CompetitionQuestion[] }
  | { type: "answer"; index: number; optionIndex: number }
  | { type: "playAgain" }
  | { type: "ping" }

export interface WelcomeMessage {
  type: "welcome"
  code: string
  playerId: string
  token: string
  hostId: string
  phase: CompetitionPhase
  players: CompetitionPlayer[]
  config: CompetitionConfig
  question?: CompetitionQuestionPayload
  selected?: number | null
  reveal?: CompetitionReveal
  result?: CompetitionResult
  answeredCount?: { answered: number; total: number }
}

export type ServerMessage =
  | WelcomeMessage
  | { type: "players"; hostId: string; players: CompetitionPlayer[] }
  | { type: "config"; config: CompetitionConfig }
  | { type: "gameStarted"; total: number; timePerQuestionMs: number }
  | { type: "question"; question: CompetitionQuestionPayload }
  | { type: "answerAccepted"; index: number; optionIndex: number }
  | { type: "answerProgress"; answered: number; total: number }
  | { type: "reveal"; reveal: CompetitionReveal }
  | { type: "gameEnd"; result: CompetitionResult }
  | { type: "lobby"; players: CompetitionPlayer[]; config: CompetitionConfig }
  | { type: "left" }
  | { type: "roomClosed"; reason: string }
  | { type: "error"; message: string }
  | { type: "pong" }

export interface AnswerProgress {
  answered: number
  total: number
}

export const DEFAULT_COMPETITION_CONFIG: CompetitionConfig = {
  category: "words",
  groupId: "all",
  questionCount: 10,
  timePerQuestionMs: 15_000,
}
