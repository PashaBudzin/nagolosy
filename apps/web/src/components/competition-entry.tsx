import { useState, type FormEvent } from "react"
import { RiAddLine, RiGroupLine, RiLoginBoxLine } from "@remixicon/react"
import { Button } from "@/components/ui/button"
import { readSavedNickname } from "@/hooks/use-competition"

interface CompetitionEntryProps {
  connected: boolean
  initialCode: string
  onCreate: (name: string) => void
  onJoin: (code: string, name: string) => void
}

export function CompetitionEntry({
  connected,
  initialCode,
  onCreate,
  onJoin,
}: CompetitionEntryProps) {
  const [name, setName] = useState(() => readSavedNickname())
  const [code, setCode] = useState(initialCode)
  const trimmedName = name.trim()
  const trimmedCode = code.trim().toUpperCase()

  const handleCreate = () => {
    if (!trimmedName || !connected) return
    onCreate(trimmedName)
  }

  const handleJoin = (event: FormEvent) => {
    event.preventDefault()
    if (!trimmedName || trimmedCode.length < 3 || !connected) return
    onJoin(trimmedCode, trimmedName)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border bg-card p-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Ваше ім'я</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value.slice(0, 24))}
            placeholder="Наприклад, Олена"
            className="h-10 rounded-md border border-border bg-input/30 px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            autoComplete="nickname"
          />
        </label>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <RiAddLine className="size-5 text-primary" />
          <h2 className="font-semibold">Створити кімнату</h2>
        </div>
        <p className="mb-3 text-sm text-muted-foreground">
          Ви станете організатором: оберете тему, кількість питань і час на
          відповідь. До кімнати можуть долучитися від 2 до 10 гравців.
        </p>
        <Button
          className="w-full"
          disabled={!connected || trimmedName.length === 0}
          onClick={handleCreate}
        >
          <RiGroupLine />
          Створити кімнату
        </Button>
      </div>

      <form onSubmit={handleJoin} className="rounded-xl border bg-card p-4">
        <div className="mb-3 flex items-center gap-2">
          <RiLoginBoxLine className="size-5 text-primary" />
          <h2 className="font-semibold">Долучитися за кодом</h2>
        </div>
        <div className="flex flex-col gap-3">
          <input
            value={code}
            onChange={(event) =>
              setCode(
                event.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")
                  .slice(0, 6)
              )
            }
            placeholder="Код кімнати"
            className="h-10 rounded-md border border-border bg-input/30 px-3 text-center font-mono text-lg tracking-[0.3em] uppercase outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={6}
          />
          <Button
            type="submit"
            variant="secondary"
            className="w-full"
            disabled={
              !connected || trimmedName.length === 0 || trimmedCode.length < 3
            }
          >
            Долучитися
          </Button>
        </div>
      </form>
    </div>
  )
}
