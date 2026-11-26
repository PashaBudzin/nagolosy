import type { HistoryEntry } from "@/types"

export interface SessionLike<TResult> {
  id: string
  timestamp: number
  results: TResult[]
}

export interface ItemStats {
  total: number
  correct: number
  history: HistoryEntry[]
}

export function aggregateStats<TItem, TResult extends { correct: boolean }>(
  seeds: TItem[],
  keyOfItem: (item: TItem) => string,
  sessions: SessionLike<TResult>[],
  keyOfResult: (result: TResult) => string,
): (TItem & ItemStats)[] {
  const map = new Map<string, { item: TItem; history: HistoryEntry[] }>()

  for (const item of seeds) {
    const key = keyOfItem(item)
    if (!map.has(key)) map.set(key, { item, history: [] })
  }

  for (const session of sessions) {
    for (const result of session.results) {
      const entry = map.get(keyOfResult(result))
      if (entry) {
        entry.history.push({
          correct: result.correct,
          timestamp: session.timestamp,
          sessionId: session.id,
        })
      }
    }
  }

  return Array.from(map.values()).map(({ item, history }) => ({
    ...item,
    total: history.length,
    correct: history.filter((h) => h.correct).length,
    history,
  }))
}

export function pickProblematic<T extends { total: number; correct: number }>(
  stats: T[],
  count: number,
  max = 30,
): T[] {
  return stats
    .filter((s) => s.total > 0)
    .sort((a, b) => a.correct / a.total - b.correct / b.total)
    .slice(0, Math.min(count, max))
}
