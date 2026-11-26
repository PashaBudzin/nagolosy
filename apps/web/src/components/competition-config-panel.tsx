import { Button } from "@/components/ui/button"
import {
  COMPETITION_CATEGORIES,
  COMPETITION_GROUPS,
} from "@/lib/competition-questions"
import type { CompetitionConfig } from "@/lib/competition-types"
import { cn } from "@/lib/utils"

interface CompetitionConfigPanelProps {
  config: CompetitionConfig
  editable: boolean
  onChange: (config: Partial<CompetitionConfig>) => void
}

const QUESTION_COUNTS = [5, 10, 15, 20]
const TIME_OPTIONS = [
  { value: 10_000, label: "10 секунд" },
  { value: 15_000, label: "15 секунд" },
  { value: 20_000, label: "20 секунд" },
  { value: 30_000, label: "30 секунд" },
]

const selectClassName =
  "h-9 rounded-md border border-border bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:opacity-60"

export function CompetitionConfigPanel({
  config,
  editable,
  onChange,
}: CompetitionConfigPanelProps) {
  const groups = COMPETITION_GROUPS[config.category]
  const categoryMeta = COMPETITION_CATEGORIES.find(
    (category) => category.id === config.category
  )

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Налаштування гри</h2>
          <p className="text-sm text-muted-foreground">
            {categoryMeta?.description}
          </p>
        </div>
        {!editable && (
          <span className="shrink-0 text-xs text-muted-foreground">
            Змінює організатор
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        {COMPETITION_CATEGORIES.map((category) => (
          <Button
            key={category.id}
            type="button"
            size="sm"
            variant={config.category === category.id ? "default" : "outline"}
            className="h-auto min-h-9 py-2 whitespace-normal"
            disabled={!editable}
            onClick={() => onChange({ category: category.id, groupId: "all" })}
          >
            {category.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Група
          </span>
          <select
            value={String(config.groupId)}
            disabled={!editable}
            className={cn(selectClassName, "w-full")}
            onChange={(event) =>
              onChange({
                groupId:
                  event.target.value === "all"
                    ? "all"
                    : Number(event.target.value),
              })
            }
          >
            <option value="all">Усі</option>
            {groups.map((group) => (
              <option key={group.id} value={String(group.id)}>
                {group.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Питань
          </span>
          <select
            value={String(config.questionCount)}
            disabled={!editable}
            className={cn(selectClassName, "w-full")}
            onChange={(event) =>
              onChange({ questionCount: Number(event.target.value) })
            }
          >
            {QUESTION_COUNTS.map((count) => (
              <option key={count} value={String(count)}>
                {count}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-muted-foreground">
            Час на питання
          </span>
          <select
            value={String(config.timePerQuestionMs)}
            disabled={!editable}
            className={cn(selectClassName, "w-full")}
            onChange={(event) =>
              onChange({ timePerQuestionMs: Number(event.target.value) })
            }
          >
            {TIME_OPTIONS.map((option) => (
              <option key={option.value} value={String(option.value)}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
