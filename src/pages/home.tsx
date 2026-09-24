import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { GROUPS } from "@/data/groups"
import { IDIOM_GROUPS } from "@/data/idiom-groups"
import { HISTORY_GROUPS } from "@/data/history-groups"
import { TERM_GROUPS } from "@/data/term-groups"
import { VISUAL_HISTORY_GROUPS } from "@/data/visual-history-groups"
import { Button } from "@/components/ui/button"
import { QuizModeSwitch } from "@/components/ui/quiz-mode-switch"
import type { MatchMode } from "@/lib/match"
import { useSessions } from "@/hooks/use-sessions"
import { useIdiomSessions } from "@/hooks/use-idiom-sessions"
import { useHistorySessions } from "@/hooks/use-history-sessions"
import { useTermSessions } from "@/hooks/use-term-sessions"
import { useVisualHistorySessions } from "@/hooks/use-visual-history-sessions"

type Mode = "words" | "idioms" | "history" | "terms" | "visual-history"

const TERM_MODE_LABELS: Record<MatchMode, string> = {
  "item-to-definition": "Термін → визначення",
  "definition-to-item": "Визначення → термін",
}

interface TrainingGroup {
  id: number | string
  name: string
  indices: number[]
  subgroups?: TrainingGroup[]
}

interface TrainingPanelProps {
  groupNoun: string
  pickText: string
  allLabel: (count: number) => string
  problematicLabel: string
  problematicButtonLabel: (count: number) => string
  groups: TrainingGroup[]
  onStart: (indices: number[]) => void
  onProblematic: (count: number) => void
  onShowStats: () => void
  onShowAnswers: () => void
}

function TrainingPanel({
  groupNoun,
  pickText,
  allLabel,
  problematicLabel,
  problematicButtonLabel,
  groups,
  onStart,
  onProblematic,
  onShowStats,
  onShowAnswers,
}: TrainingPanelProps) {
  const allIndices = groups.flatMap((g) => g.indices)

  return (
    <>
      <p className="text-sm text-muted-foreground">{pickText}</p>

      <div className="flex flex-col gap-2">
        {groups.map((group) => (
          <div key={group.id} className="flex flex-col gap-1.5">
            <Button
              variant="outline"
              className="h-auto min-h-9 py-2 whitespace-normal"
              onClick={() => onStart(group.indices)}
            >
              <span className="whitespace-normal">{group.name}</span>
              <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">
                {group.indices.length} {groupNoun}
              </span>
            </Button>
            {group.subgroups && (
              <div className="flex flex-col gap-1.5 pl-3">
                {group.subgroups.map((sub) => (
                  <Button
                    key={sub.id}
                    variant="ghost"
                    className="h-auto min-h-9 py-2 whitespace-normal"
                    onClick={() => onStart(sub.indices)}
                  >
                    <span className="whitespace-normal">{sub.name}</span>
                    <span className="shrink-0 text-xs whitespace-nowrap text-muted-foreground">
                      {sub.indices.length} {groupNoun}
                    </span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <Button className="mt-2" onClick={() => onStart(allIndices)}>
        {allLabel(allIndices.length)}
      </Button>

      <div className="mt-4 space-y-2">
        <p className="text-sm font-medium">{problematicLabel}</p>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => onProblematic(10)}>
            {problematicButtonLabel(10)}
          </Button>
          <Button variant="secondary" onClick={() => onProblematic(15)}>
            {problematicButtonLabel(15)}
          </Button>
          <Button variant="secondary" onClick={() => onProblematic(30)}>
            {problematicButtonLabel(30)}
          </Button>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <Button variant="ghost" onClick={onShowAnswers}>
          Відповіді
        </Button>
        <Button variant="ghost" onClick={onShowStats}>
          Статистика
        </Button>
      </div>
    </>
  )
}

export function Home() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>("words")
  const [termMode, setTermMode] = useState<MatchMode>("item-to-definition")
  const { getProblematicWordIndices } = useSessions()
  const { getProblematicIdiomIndices } = useIdiomSessions()
  const { getProblematicHistoryIndices } = useHistorySessions()
  const { getProblematicTermIndices } = useTermSessions()
  const { getProblematicVisualHistoryIndices } = useVisualHistorySessions()

  const handleProblematic = (count: number) => {
    const indices = getProblematicWordIndices(count)
    if (indices.length === 0) return
    navigate("/test", { state: { wordIndices: indices } })
  }

  const handleProblematicIdioms = (count: number) => {
    const indices = getProblematicIdiomIndices(count)
    if (indices.length === 0) return
    navigate("/idiom-test", { state: { idiomIndices: indices } })
  }

  const handleProblematicHistory = (count: number) => {
    const indices = getProblematicHistoryIndices(count)
    if (indices.length === 0) return
    navigate("/history-test", { state: { historyIndices: indices } })
  }

  const handleProblematicVisualHistory = (count: number) => {
    const indices = getProblematicVisualHistoryIndices(count)
    if (indices.length === 0) return
    navigate("/visual-history-test", {
      state: { visualHistoryIndices: indices },
    })
  }

  const handleProblematicTerms = (count: number) => {
    const indices = getProblematicTermIndices(count)
    if (indices.length === 0) return
    navigate("/term-test", { state: { termIndices: indices, termMode } })
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">
        {mode === "words"
          ? "Наголоси НМТ"
          : mode === "idioms"
            ? "Фразеологізми НМТ"
            : mode === "history"
              ? "Історія дати"
              : mode === "terms"
                ? "Історичні терміни НМТ"
                : "Історія візуальні об'єкти"}
      </h1>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={mode === "words" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setMode("words")}
        >
          Наголоси
        </Button>
        <Button
          variant={mode === "idioms" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setMode("idioms")}
        >
          Фразеологізми
        </Button>
        <Button
          variant={mode === "history" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setMode("history")}
        >
          Історія дати
        </Button>
        <Button
          variant={mode === "terms" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setMode("terms")}
        >
          Терміни
        </Button>
        <Button
          variant={mode === "visual-history" ? "default" : "outline"}
          className="flex-1"
          onClick={() => setMode("visual-history")}
        >
          Візуальні
        </Button>
      </div>

      {mode === "words" ? (
        <TrainingPanel
          groupNoun="слів"
          pickText="Обери групу слів для тренування"
          allLabel={(count) => `Усі слова (${count})`}
          problematicLabel="Проблемні слова"
          problematicButtonLabel={(count) => `${count} слів`}
          groups={GROUPS.map((g) => ({
            id: g.id,
            name: g.name,
            indices: g.wordIndices,
          }))}
          onStart={(indices) =>
            navigate("/test", { state: { wordIndices: indices } })
          }
          onProblematic={handleProblematic}
          onShowStats={() => navigate("/stats")}
          onShowAnswers={() => navigate("/answers/words")}
        />
      ) : mode === "idioms" ? (
        <TrainingPanel
          groupNoun="фраз"
          pickText="Обери групу фразеологізмів для тренування"
          allLabel={(count) => `Усі фразеологізми (${count})`}
          problematicLabel="Проблемні фразеологізми"
          problematicButtonLabel={(count) => `${count}`}
          groups={IDIOM_GROUPS.map((g) => ({
            id: g.id,
            name: g.name,
            indices: g.idiomIndices,
          }))}
          onStart={(indices) =>
            navigate("/idiom-test", { state: { idiomIndices: indices } })
          }
          onProblematic={handleProblematicIdioms}
          onShowStats={() => navigate("/idiom-stats")}
          onShowAnswers={() => navigate("/answers/idioms")}
        />
      ) : mode === "history" ? (
        <TrainingPanel
          groupNoun="подій"
          pickText="Обери період для тренування"
          allLabel={(count) => `Усі події (${count})`}
          problematicLabel="Проблемні події"
          problematicButtonLabel={(count) => `${count} подій`}
          groups={HISTORY_GROUPS.map((g) => ({
            id: g.id,
            name: g.name,
            indices: g.historyIndices,
            subgroups: g.subgroups.map((s) => ({
              id: s.id,
              name: s.name,
              indices: s.historyIndices,
            })),
          }))}
          onStart={(indices) =>
            navigate("/history-test", { state: { historyIndices: indices } })
          }
          onProblematic={handleProblematicHistory}
          onShowStats={() => navigate("/history-stats")}
          onShowAnswers={() => navigate("/answers/history")}
        />
      ) : mode === "terms" ? (
        <>
          <QuizModeSwitch
            value={termMode}
            onValueChange={setTermMode}
            labels={TERM_MODE_LABELS}
            className="self-center"
          />
          <TrainingPanel
            groupNoun="термінів"
            pickText="Обери групу термінів для тренування"
            allLabel={(count) => `Усі терміни (${count})`}
            problematicLabel="Проблемні терміни"
            problematicButtonLabel={(count) => `${count} термінів`}
            groups={TERM_GROUPS.map((g) => ({
              id: g.id,
              name: g.name,
              indices: g.termIndices,
            }))}
            onStart={(indices) =>
              navigate("/term-test", {
                state: { termIndices: indices, termMode },
              })
            }
            onProblematic={handleProblematicTerms}
            onShowStats={() => navigate("/term-stats")}
            onShowAnswers={() => navigate("/answers/terms")}
          />
        </>
      ) : (
        <TrainingPanel
          groupNoun="об'єктів"
          pickText="Обери категорію для тренування"
          allLabel={(count) => `Усі об'єкти (${count})`}
          problematicLabel="Проблемні об'єкти"
          problematicButtonLabel={(count) => `${count}`}
          groups={VISUAL_HISTORY_GROUPS.map((g) => ({
            id: g.id,
            name: g.name,
            indices: g.itemIndices,
          }))}
          onStart={(indices) =>
            navigate("/visual-history-test", {
              state: { visualHistoryIndices: indices },
            })
          }
          onProblematic={handleProblematicVisualHistory}
          onShowStats={() => navigate("/visual-history-stats")}
          onShowAnswers={() => navigate("/answers/visual-history")}
        />
      )}
    </div>
  )
}
