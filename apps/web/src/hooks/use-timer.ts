import { useCallback, useEffect, useRef, useState } from "react"

export function useTimer() {
  const [elapsedMs, setElapsedMs] = useState(0)
  const startRef = useRef(0)

  useEffect(() => {
    startRef.current = Date.now()
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startRef.current)
    }, 200)
    return () => clearInterval(interval)
  }, [])

  const now = useCallback(() => Date.now() - startRef.current, [])

  return { elapsedMs, now }
}
