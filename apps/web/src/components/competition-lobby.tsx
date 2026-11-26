import { useEffect, useState } from "react"
import {
  RiCheckLine,
  RiFileCopyLine,
  RiGroupLine,
  RiTrophyLine,
} from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { CompetitionConfigPanel } from "@/components/competition-config-panel"
import {
  buildCompetitionQuestions,
  buildNmtCompetitionQuestions,
} from "@/lib/competition-questions"

import type {
  CompetitionConfig,
  CompetitionPlayer,
  CompetitionQuestion,
} from "@/lib/competition-types"
import { cn } from "@/lib/utils"

interface CompetitionLobbyProps {
  code: string
  playerId: string
  hostId: string
  players: CompetitionPlayer[]
  config: CompetitionConfig
  isHost: boolean
  onUpdateConfig: (config: Partial<CompetitionConfig>) => void
  onStart: (questions: ReturnType<typeof buildCompetitionQuestions>) => void
  onLeave: () => void
}

export function CompetitionLobby({
  code,
  playerId,
  hostId,
  players,
  config,
  isHost,
  onUpdateConfig,
  onStart,
  onLeave,
}: CompetitionLobbyProps) {
  const [copied, setCopied] = useState(false)
  const [nmtResult, setNmtResult] = useState<{
    key: string
    questions: CompetitionQuestion[]
  } | null>(null)
  const connectedCount = players.filter((player) => player.connected).length

  const { category, groupId, questionCount, timePerQuestionMs } = config
  const nmtKey = `${groupId}-${questionCount}`

  useEffect(() => {
    if (category !== "nmt") return
    let active = true
    const key = `${groupId}-${questionCount}`

    buildNmtCompetitionQuestions({
      category,
      groupId,
      questionCount,
      timePerQuestionMs,
    })
      .then((built) => {
        if (active) setNmtResult({ key, questions: built })
      })
      .catch(() => {
        if (active) setNmtResult({ key, questions: [] })
      })

    return () => {
      active = false
    }
  }, [category, groupId, questionCount, timePerQuestionMs])

  const nmtQuestions = nmtResult?.key === nmtKey ? nmtResult.questions : []
  const questions =
    category === "nmt" ? nmtQuestions : buildCompetitionQuestions(config)
  const canStart = connectedCount >= 2 && questions.length >= 2

  const inviteLink = `${window.location.origin}/competition?room=${code}`

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access is optional; the code is still visible.
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Код кімнати
            </p>
            <p className="font-mono text-4xl font-bold tracking-[0.25em]">
              {code}
            </p>
          </div>
          <Button type="button" variant="outline" onClick={copyInvite}>
            {copied ? <RiCheckLine /> : <RiFileCopyLine />}
            {copied ? "Скопійовано" : "Копіювати запрошення"}
          </Button>
        </div>
        <p className="mt-2 text-xs break-all text-muted-foreground">
          {inviteLink}
        </p>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-semibold">
            <RiGroupLine className="size-5 text-primary" />
            Гравці
          </h2>
          <span className="text-sm text-muted-foreground">
            {connectedCount} / 10
          </span>
        </div>

        <ul className="flex flex-col gap-2">
          {players.map((player) => (
            <li
              key={player.id}
              className={cn(
                "flex items-center gap-3 rounded-md border px-3 py-2",
                player.connected ? "bg-background" : "opacity-50"
              )}
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary uppercase">
                {player.name.slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {player.name}
                {player.id === playerId && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    (ви)
                  </span>
                )}
              </span>
              {player.id === hostId && (
                <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                  <RiTrophyLine className="size-3.5" />
                  організатор
                </span>
              )}
              {!player.connected && (
                <span className="text-xs text-muted-foreground">
                  відключився
                </span>
              )}
            </li>
          ))}
        </ul>

        {connectedCount < 2 && (
          <p className="mt-3 text-sm text-muted-foreground">
            Для старту потрібно щонайменше 2 гравці. Надішліть друзям код або
            посилання.
          </p>
        )}
      </div>

      <CompetitionConfigPanel
        config={config}
        editable={isHost}
        onChange={onUpdateConfig}
      />

      {isHost ? (
        <div className="flex flex-col gap-2">
          <Button
            size="lg"
            disabled={!canStart}
            onClick={() => onStart(questions)}
          >
            Почати гру ({questions.length} питань)
          </Button>
          {questions.length < config.questionCount && (
            <p className="text-xs text-muted-foreground">
              У вибраній групі доступно {questions.length} питань.
            </p>
          )}
        </div>
      ) : (
        <p className="rounded-xl border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
          Чекаємо, коли організатор почне гру…
        </p>
      )}

      <Button variant="ghost" onClick={onLeave}>
        Вийти з кімнати
      </Button>
    </div>
  )
}
