import { useCallback, useSyncExternalStore } from "react"
import type { SessionData, WordStats } from "@/types"
import { WORDS_RAW } from "@/data/words"
import { getWordData } from "@/lib/stress"

const PROBLEMATIC_MAX = 30

const STORAGE_KEY = "nagolosy-sessions"
const MAX_SESSIONS = 5

let cachedSessions: SessionData[] | null = null

function getStored(): SessionData[] {
  if (cachedSessions !== null) return cachedSessions
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    cachedSessions = raw ? (JSON.parse(raw) as SessionData[]) : []
  } catch {
    cachedSessions = []
  }
  return cachedSessions
}

function storeSessions(sessions: SessionData[]) {
  cachedSessions = sessions
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
}

const listeners = new Set<() => void>()

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function snapshot(): SessionData[] {
  return getStored()
}

function notify() {
  for (const cb of listeners) cb()
}

export function useSessions() {
  const sessions = useSyncExternalStore(subscribe, snapshot, snapshot)

  const addSession = useCallback((session: SessionData) => {
    const current = getStored()
    const updated = [session, ...current].slice(0, MAX_SESSIONS)
    storeSessions(updated)
    notify()
  }, [])

  const clearSessions = useCallback(() => {
    storeSessions([])
    notify()
  }, [])

  const getWordStats = useCallback((): WordStats[] => {
    const sessions = getStored()

    const matchKey = (word: string, indices: number[]) =>
      `${word}|${JSON.stringify(indices)}`

    const map = new Map<
      string,
      { word: string; stressIndices: number[]; explanation?: string; history: WordStats["history"] }
    >()

    for (const wordRaw of WORDS_RAW) {
      const { text, stressIndices, explanation } = getWordData(wordRaw)
      const key = matchKey(text, stressIndices)
      if (!map.has(key)) {
        map.set(key, { word: text, stressIndices, explanation, history: [] })
      }
    }

    for (const session of sessions) {
      for (const result of session.results) {
        const key = matchKey(result.word, result.stressIndices)
        const entry = map.get(key)
        if (entry) {
          entry.history.push({
            correct: result.correct,
            timestamp: session.timestamp,
            sessionId: session.id,
          })
        }
      }
    }

    return Array.from(map.values()).map((entry) => {
      const total = entry.history.length
      const correct = entry.history.filter((h) => h.correct).length
      return { ...entry, total, correct }
    })
  }, [])

  const getProblematicWordIndices = useCallback((count: number): number[] => {
    const stats = getWordStats()
    const sorted = stats
      .filter((s) => s.total > 0)
      .sort((a, b) => a.correct / a.total - b.correct / b.total)
      .slice(0, Math.min(count, PROBLEMATIC_MAX))

    const indices: number[] = []
    for (const stat of sorted) {
      for (let i = 0; i < WORDS_RAW.length; i++) {
        const { text, stressIndices } = getWordData(WORDS_RAW[i])
        if (
          text === stat.word &&
          JSON.stringify(stressIndices) === JSON.stringify(stat.stressIndices)
        ) {
          indices.push(i)
        }
      }
    }
    return indices
  }, [getWordStats])

  return { sessions, addSession, clearSessions, getWordStats, getProblematicWordIndices }
}
