import type { MatchMode } from "@/lib/match"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface QuizModeSwitchProps {
  value: MatchMode
  onValueChange: (mode: MatchMode) => void
  labels: Record<MatchMode, string>
  className?: string
}

export function QuizModeSwitch({
  value,
  onValueChange,
  labels,
  className,
}: QuizModeSwitchProps) {
  const modes: MatchMode[] = ["item-to-definition", "definition-to-item"]

  return (
    <div className={cn("flex rounded-full bg-muted p-1", className)}>
      {modes.map((mode) => (
        <Button
          key={mode}
          variant={value === mode ? "default" : "ghost"}
          size="xs"
          onClick={() => onValueChange(mode)}
        >
          {labels[mode]}
        </Button>
      ))}
    </div>
  )
}
