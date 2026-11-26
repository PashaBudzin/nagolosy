import { useCallback, useSyncExternalStore } from "react"

export interface SessionStore<TSession> {
  subscribe(cb: () => void): () => void
  getSnapshot(): TSession[]
  addSession(session: TSession): void
  clearSessions(): void
}

export function createSessionStore<TSession>(
  storageKey: string,
  maxSessions: number,
): SessionStore<TSession> {
  let cached: TSession[] | null = null
  const listeners = new Set<() => void>()

  function getStored(): TSession[] {
    if (cached !== null) return cached
    try {
      const raw = localStorage.getItem(storageKey)
      cached = raw ? (JSON.parse(raw) as TSession[]) : []
    } catch {
      cached = []
    }
    return cached
  }

  function storeSessions(sessions: TSession[]) {
    cached = sessions
    localStorage.setItem(storageKey, JSON.stringify(sessions))
  }

  function subscribe(cb: () => void) {
    listeners.add(cb)
    return () => {
      listeners.delete(cb)
    }
  }

  function getSnapshot(): TSession[] {
    return getStored()
  }

  function notify() {
    for (const cb of listeners) cb()
  }

  return {
    subscribe,
    getSnapshot,
    addSession(session: TSession) {
      const updated = [session, ...getStored()].slice(0, maxSessions)
      storeSessions(updated)
      notify()
    },
    clearSessions() {
      storeSessions([])
      notify()
    },
  }
}

export function useSessionStore<TSession>(store: SessionStore<TSession>) {
  const sessions = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  )
  const addSession = useCallback(
    (session: TSession) => store.addSession(session),
    [store],
  )
  const clearSessions = useCallback(() => store.clearSessions(), [store])
  return { sessions, addSession, clearSessions }
}
