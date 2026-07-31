import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { GROUPS } from "@/data/groups"
import { IDIOM_GROUPS } from "@/data/idiom-groups"
import { Button } from "@/components/ui/button"
import { useSessions } from "@/hooks/use-sessions"
import { useIdiomSessions } from "@/hooks/use-idiom-sessions"

type Mode = "words" | "idioms"

interface TrainingGroup {
  id: number
  name: string
  indices: number[]
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
}: TrainingPanelProps) {
  const allIndices = groups.flatMap((g) => g.indices)

  return (
    <>
      <p className="text-sm text-muted-foreground">{pickText}</p>

      <div className="flex flex-col gap-2">
        {groups.map((group) => (
          <Button
            key={group.id}
            variant="outline"
            className="justify-between"
            onClick={() => onStart(group.indices)}
          >
            <span>{group.name}</span>
            <span className="text-xs text-muted-foreground">
              {group.indices.length} {groupNoun}
            </span>
          </Button>
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

      <Button variant="ghost" className="mt-4" onClick={onShowStats}>
        Статистика
      </Button>
    </>
  )
}

export function Home() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<Mode>("words")
  const { getProblematicWordIndices } = useSessions()
  const { getProblematicIdiomIndices } = useIdiomSessions()

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

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">
        {mode === "words" ? "Наголоси НМТ" : "Фразеологізми НМТ"}
      </h1>

      <div className="flex gap-2">
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
          onStart={(indices) => navigate("/test", { state: { wordIndices: indices } })}
          onProblematic={handleProblematic}
          onShowStats={() => navigate("/stats")}
        />
      ) : (
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
          onStart={(indices) => navigate("/idiom-test", { state: { idiomIndices: indices } })}
          onProblematic={handleProblematicIdioms}
          onShowStats={() => navigate("/idiom-stats")}
        />
      )}
    </div>
  )
}
