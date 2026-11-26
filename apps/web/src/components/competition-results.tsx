import { RiMedalLine, RiRefreshLine, RiTrophyLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import type { CompetitionResult } from "@/lib/competition-types"
import { cn } from "@/lib/utils"

interface CompetitionResultsProps {
  result: CompetitionResult
  playerId: string
  isHost: boolean
  onPlayAgain: () => void
  onLeave: () => void
}

const MEDALS = ["🥇", "🥈", "🥉"]

export function CompetitionResults({
  result,
  playerId,
  isHost,
  onPlayAgain,
  onLeave,
}: CompetitionResultsProps) {
  const ownEntry = result.leaderboard.find(
    (entry) => entry.playerId === playerId
  )
  const ownPlace =
    result.leaderboard.findIndex((entry) => entry.playerId === playerId) + 1

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border bg-card p-4 text-center">
        <RiTrophyLine className="mx-auto mb-2 size-10 text-amber-500" />
        <h2 className="text-xl font-bold">Гру завершено</h2>
        <p className="text-sm text-muted-foreground">
          {result.totalQuestions} питань позаду
        </p>
        {ownEntry && (
          <p className="mt-2 text-sm">
            Ваше місце: <span className="font-semibold">#{ownPlace}</span> ·{" "}
            {ownEntry.score} очок · {ownEntry.correct} правильних
          </p>
        )}
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-3 flex items-center gap-2 font-semibold">
          <RiMedalLine className="size-5 text-primary" />
          Результати
        </h3>
        <ol className="flex flex-col gap-1.5">
          {result.leaderboard.map((entry, index) => (
            <li
              key={entry.playerId}
              className={cn(
                "flex items-center gap-3 rounded-md border px-3 py-2",
                entry.playerId === playerId && "border-primary bg-primary/10"
              )}
            >
              <span className="w-6 shrink-0 text-center text-sm font-semibold tabular-nums">
                {MEDALS[index] ?? index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {entry.name}
                {entry.playerId === playerId && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    (ви)
                  </span>
                )}
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {entry.correct} ✓
              </span>
              <span className="w-12 shrink-0 text-right font-semibold tabular-nums">
                {entry.score}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {isHost ? (
        <Button size="lg" onClick={onPlayAgain}>
          <RiRefreshLine />
          Грати ще
        </Button>
      ) : (
        <p className="rounded-xl border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
          Організатор може запустити нову гру для всіх учасників.
        </p>
      )}

      <Button variant="ghost" onClick={onLeave}>
        Вийти з кімнати
      </Button>
    </div>
  )
}
