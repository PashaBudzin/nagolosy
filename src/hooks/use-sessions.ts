import { useCallback, useSyncExternalStore } from "react"
import type { SessionData, WordStats } from "@/types"
import { WORDS_RAW } from "@/data/words"
import { getWordData } from "@/lib/stress"

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
    const map = new Map<
      string,
      { stressIndices: number[]; history: { correct: boolean; timestamp: number; sessionId: string }[] }
    >()

    for (const wordRaw of WORDS_RAW) {
      const { text, stressIndices } = getWordData(wordRaw)
      if (!map.has(text)) {
        map.set(text, { stressIndices, history: [] })
      }
    }

    for (const session of sessions) {
      for (const result of session.results) {
        const entry = map.get(result.word)
        if (entry) {
          entry.history.push({
            correct: result.correct,
            timestamp: session.timestamp,
            sessionId: session.id,
          })
        }
      }
    }

    return Array.from(map.entries()).map(([word, data]) => {
      const total = data.history.length
      const correct = data.history.filter((h) => h.correct).length
      return {
        word,
        stressIndices: data.stressIndices,
        total,
        correct,
        history: data.history,
      }
    })
  }, [])

  return { sessions, addSession, clearSessions, getWordStats }
}
