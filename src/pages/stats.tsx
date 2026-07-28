import { useNavigate } from "react-router-dom"
import { useSessions } from "@/hooks/use-sessions"
import { Button } from "@/components/ui/button"
import { displayWord } from "@/lib/stress"

export function Stats() {
  const navigate = useNavigate()
  const { getWordStats, clearSessions } = useSessions()
  const stats = getWordStats()

  const sorted = [...stats].sort((a, b) => {
    const aRatio = a.total > 0 ? a.correct / a.total : 0
    const bRatio = b.total > 0 ? b.correct / b.total : 0
    return aRatio - bRatio
  })

  const totalAttempts = stats.reduce((s, w) => s + w.total, 0)
  const totalCorrect = stats.reduce((s, w) => s + w.correct, 0)

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Статистика</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            На головну
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm("Очистити всю історію сесій?")) clearSessions()
            }}
          >
            Очистити
          </Button>
        </div>
      </div>

      {totalAttempts === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ще не було сесій. Почни тренування!
        </p>
      ) : (
        <>
          <div className="text-center text-sm text-muted-foreground">
            Усього спроб: {totalAttempts} · Правильно: {totalCorrect} (
            {Math.round((totalCorrect / totalAttempts) * 100)}%)
          </div>

          <div className="max-h-[60vh] divide-y overflow-y-auto rounded-lg border">
            {sorted.map((w) => {
              const ratio = w.total > 0 ? w.correct / w.total : 1
              const recent = w.history.slice(0, 5)
              return (
                <div
                  key={w.word}
                  className="grid grid-cols-[1fr_auto] gap-2 px-4 py-2 text-sm"
                >
                  <span className="font-medium">
                    {displayWord(w.word, w.stressIndices)}
                    {w.explanation && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({w.explanation})
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-1">
                    <span
                      className={
                        ratio < 0.5
                          ? "text-red-500"
                          : ratio < 0.8
                            ? "text-amber-500"
                            : "text-green-500"
                      }
                    >
                      {w.correct}/{w.total}
                    </span>
                    <div className="ml-2 flex gap-0.5">
                      {recent.map((h, i) => (
                        <span
                          key={i}
                          className={
                            h.correct
                              ? "text-green-500"
                              : "text-red-500"
                          }
                        >
                          {h.correct ? "●" : "○"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
