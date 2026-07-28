import { useNavigate } from "react-router-dom"
import { GROUPS } from "@/data/groups"
import { Button } from "@/components/ui/button"

export function Home() {
  const navigate = useNavigate()

  const allWordIndex = GROUPS.flatMap((g) => g.wordIndices)

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-6">
      <h1 className="text-2xl font-bold">Наголоси НМТ</h1>
      <p className="text-sm text-muted-foreground">
        Обери групу слів для тренування
      </p>

      <div className="flex flex-col gap-2">
        {GROUPS.map((group) => (
          <Button
            key={group.id}
            variant="outline"
            className="justify-between"
            onClick={() =>
              navigate("/test", {
                state: { wordIndices: group.wordIndices },
              })
            }
          >
            <span>{group.name}</span>
            <span className="text-xs text-muted-foreground">
              {group.wordIndices.length} слів
            </span>
          </Button>
        ))}
      </div>

      <Button
        className="mt-2"
        onClick={() =>
          navigate("/test", {
            state: { wordIndices: allWordIndex },
          })
        }
      >
        Усі слова ({allWordIndex.length})
      </Button>

      <Button
        variant="ghost"
        className="mt-4"
        onClick={() => navigate("/stats")}
      >
        Статистика
      </Button>
    </div>
  )
}
