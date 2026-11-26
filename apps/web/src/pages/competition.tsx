import { useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { RiArrowLeftLine, RiRefreshLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { CompetitionEntry } from "@/components/competition-entry"
import { CompetitionLobby } from "@/components/competition-lobby"
import { CompetitionGame } from "@/components/competition-game"
import { CompetitionResults } from "@/components/competition-results"
import { useCompetition } from "@/hooks/use-competition"
import { cn } from "@/lib/utils"

const STATUS_LABELS = {
  connecting: "Підключення…",
  connected: "Онлайн",
  reconnecting: "Перепідключення…",
  offline: "Немає з'єднання",
} as const

export function Competition() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const roomFromUrl = (searchParams.get("room") ?? "").trim().toUpperCase()
  const competition = useCompetition(roomFromUrl)

  useEffect(() => {
    if (competition.code && competition.code !== roomFromUrl) {
      setSearchParams({ room: competition.code }, { replace: true })
    }
  }, [competition.code, roomFromUrl, setSearchParams])

  const handleLeave = () => {
    competition.leave()
    if (roomFromUrl) setSearchParams({}, { replace: true })
  }

  const handleHome = () => {
    handleLeave()
    navigate("/")
  }

  const showOfflineHint =
    competition.status === "offline" ||
    (competition.status === "reconnecting" && !competition.code)

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={handleHome}>
          <RiArrowLeftLine />
          На головну
        </Button>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span
            className={cn(
              "size-2 rounded-full",
              competition.status === "connected"
                ? "bg-green-500"
                : competition.status === "connecting" ||
                    competition.status === "reconnecting"
                  ? "animate-pulse bg-amber-500"
                  : "bg-destructive"
            )}
          />
          {STATUS_LABELS[competition.status]}
        </span>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Змагання в групі</h1>
        <p className="text-sm text-muted-foreground">
          Жива вікторина для 2–10 гравців в одній кімнаті.
        </p>
      </div>

      {competition.error && (
        <div className="flex items-start justify-between gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <span>{competition.error}</span>
          <button
            type="button"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            onClick={competition.clearError}
            aria-label="Закрити"
          >
            ×
          </button>
        </div>
      )}

      {showOfflineHint && !competition.error && (
        <div className="flex flex-col gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <span>
            Не вдалося підключитися до сервера змагань. Переконайтеся, що
            Node-сервер застосунку запущено.
          </span>
          <Button
            size="sm"
            variant="outline"
            className="self-start"
            onClick={competition.reconnect}
          >
            <RiRefreshLine />
            Спробувати ще
          </Button>
        </div>
      )}

      {!competition.code ? (
        <CompetitionEntry
          connected={competition.status === "connected"}
          initialCode={roomFromUrl}
          onCreate={competition.create}
          onJoin={competition.join}
        />
      ) : competition.phase === "lobby" ? (
        <CompetitionLobby
          code={competition.code}
          playerId={competition.playerId ?? ""}
          hostId={competition.hostId ?? ""}
          players={competition.players}
          config={competition.config}
          isHost={competition.isHost}
          onUpdateConfig={competition.updateConfig}
          onStart={competition.start}
          onLeave={handleLeave}
        />
      ) : competition.phase === "finished" && competition.result ? (
        <CompetitionResults
          result={competition.result}
          playerId={competition.playerId ?? ""}
          isHost={competition.isHost}
          onPlayAgain={competition.playAgain}
          onLeave={handleLeave}
        />
      ) : competition.question ? (
        <CompetitionGame
          key={`${competition.question.index}-${competition.question.remainingMs}`}
          playerId={competition.playerId ?? ""}
          category={competition.config.category}
          phase={competition.phase}
          players={competition.players}
          question={competition.question}
          reveal={competition.reveal}
          selected={competition.selected}
          progress={competition.progress}
          onAnswer={competition.answer}
          onLeave={handleHome}
        />
      ) : (
        <p className="rounded-xl border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
          Готуємо питання…
        </p>
      )}
    </div>
  )
}
