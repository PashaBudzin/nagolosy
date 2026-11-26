import { useCallback, useEffect, useRef, useState } from "react"
import {
  DEFAULT_COMPETITION_CONFIG,
  type AnswerProgress,
  type ClientMessage,
  type CompetitionConfig,
  type CompetitionPhase,
  type CompetitionPlayer,
  type CompetitionQuestion,
  type CompetitionQuestionPayload,
  type CompetitionResult,
  type CompetitionReveal,
  type ServerMessage,
} from "@/lib/competition-types"

export type ConnectionStatus =
  "connecting" | "connected" | "reconnecting" | "offline"

export interface CompetitionState {
  status: ConnectionStatus
  error: string | null
  code: string | null
  playerId: string | null
  hostId: string | null
  phase: CompetitionPhase
  players: CompetitionPlayer[]
  config: CompetitionConfig
  question: CompetitionQuestionPayload | null
  reveal: CompetitionReveal | null
  result: CompetitionResult | null
  /** Current, still editable selection for the active question. */
  selected: number | null
  /** Whether that selection has been locked in. */
  settled: boolean
  progress: AnswerProgress | null
  gameTotal: number | null
  timePerQuestionMs: number | null
}

const initialState: CompetitionState = {
  status: "connecting",
  error: null,
  code: null,
  playerId: null,
  hostId: null,
  phase: "lobby",
  players: [],
  config: DEFAULT_COMPETITION_CONFIG,
  question: null,
  reveal: null,
  result: null,
  selected: null,
  settled: false,
  progress: null,
  gameTotal: null,
  timePerQuestionMs: null,
}

const TOKEN_PREFIX = "nagolosy-competition-"
const NICKNAME_KEY = "nagolosy-competition-nickname"
const HEARTBEAT_MS = 10_000
// Hidden tabs throttle timers to ~1/min; don't reconnect just because of that.
const PONG_TIMEOUT_MS = 25_000
const HIDDEN_PONG_TIMEOUT_MS = 120_000
const CONNECT_TIMEOUT_MS = 8_000
const REJOIN_TIMEOUT_MS = 6_000
const RESYNC_DELAY_MS = 1_500

function tokenKey(code: string) {
  return `${TOKEN_PREFIX}${code}`
}

function readToken(code: string): string | null {
  try {
    return sessionStorage.getItem(tokenKey(code))
  } catch {
    return null
  }
}

function saveToken(code: string, token: string) {
  try {
    sessionStorage.setItem(tokenKey(code), token)
  } catch {
    // Storage may be unavailable (private mode); reconnection is just disabled.
  }
}

function clearToken(code: string) {
  try {
    sessionStorage.removeItem(tokenKey(code))
  } catch {
    // Ignore storage failures.
  }
}

export function readSavedNickname(): string {
  try {
    return localStorage.getItem(NICKNAME_KEY) ?? ""
  } catch {
    return ""
  }
}

export function saveNickname(name: string) {
  try {
    localStorage.setItem(NICKNAME_KEY, name)
  } catch {
    // Ignore storage failures.
  }
}

function socketUrl(): string {
  const configured = import.meta.env.VITE_WS_URL as string | undefined
  if (configured) return configured

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
  return `${protocol}//${window.location.host}/api/ws`
}

export function useCompetition(roomCode = "") {
  const [state, setState] = useState<CompetitionState>(initialState)
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<number | null>(null)
  const reconnectAttemptRef = useRef(0)
  const shouldReconnectRef = useRef(true)
  const codeRef = useRef<string | null>(null)
  const tokenRef = useRef<string | null>(null)
  const initialCodeRef = useRef(roomCode.trim().toUpperCase())
  const lastPongAtRef = useRef(0)
  const connectTimeoutRef = useRef<number | null>(null)
  const rejoinTimerRef = useRef<number | null>(null)
  const rejoinPendingRef = useRef(false)

  useEffect(() => {
    if (!codeRef.current) {
      initialCodeRef.current = roomCode.trim().toUpperCase()
    }
  }, [roomCode])

  const sendTo = useCallback((socket: WebSocket, message: ClientMessage) => {
    if (socket.readyState !== WebSocket.OPEN) return false
    try {
      socket.send(JSON.stringify(message))
      return true
    } catch {
      return false
    }
  }, [])

  const send = useCallback(
    (message: ClientMessage) => {
      const socket = socketRef.current
      return socket ? sendTo(socket, message) : false
    },
    [sendTo]
  )

  /** Detach a socket immediately so a stuck connection can't block reconnect. */
  const dropSocket = useCallback(() => {
    if (connectTimeoutRef.current !== null) {
      window.clearTimeout(connectTimeoutRef.current)
      connectTimeoutRef.current = null
    }
    const socket = socketRef.current
    socketRef.current = null
    if (!socket) return
    socket.onopen = null
    socket.onmessage = null
    socket.onclose = null
    socket.onerror = null
    try {
      socket.close()
    } catch {
      // A CONNECTING socket may reject close(); it is already detached.
    }
  }, [])

  const clearRejoinPending = useCallback(() => {
    rejoinPendingRef.current = false
    if (rejoinTimerRef.current !== null) {
      window.clearTimeout(rejoinTimerRef.current)
      rejoinTimerRef.current = null
    }
  }, [])

  /** Give up on a room that no longer exists and return to the entry screen. */
  const resetSession = useCallback(
    (reason: string) => {
      if (codeRef.current) clearToken(codeRef.current)
      codeRef.current = null
      tokenRef.current = null
      clearRejoinPending()
      setState((previous) => ({
        ...initialState,
        status: previous.status,
        error: reason,
      }))
    },
    [clearRejoinPending]
  )

  const handleMessage = useCallback(
    (message: ServerMessage) => {
      switch (message.type) {
        case "welcome": {
          clearRejoinPending()
          codeRef.current = message.code
          tokenRef.current = message.token
          saveToken(message.code, message.token)

          setState((previous) => ({
            ...previous,
            status: "connected",
            error: null,
            code: message.code,
            playerId: message.playerId,
            hostId: message.hostId,
            phase: message.phase,
            players: message.players,
            config: message.config,
            question: message.question ?? null,
            selected: message.selected ?? null,
            settled: message.settled ?? false,
            reveal: message.reveal ?? null,
            result: message.result ?? null,
            progress: message.answeredCount ?? null,
            gameTotal:
              message.question?.total ??
              message.result?.totalQuestions ??
              previous.gameTotal,
            timePerQuestionMs:
              message.question?.timeLimitMs ?? previous.timePerQuestionMs,
          }))
          return
        }

        case "players":
          setState((previous) => ({
            ...previous,
            hostId: message.hostId,
            players: message.players,
          }))
          return

        case "config":
          setState((previous) => ({ ...previous, config: message.config }))
          return

        case "gameStarted":
          setState((previous) => ({
            ...previous,
            phase: "playing",
            question: null,
            reveal: null,
            result: null,
            selected: null,
            settled: false,
            progress: { answered: 0, total: previous.players.length },
            gameTotal: message.total,
            timePerQuestionMs: message.timePerQuestionMs,
          }))
          return

        case "question":
          setState((previous) => ({
            ...previous,
            phase: "playing",
            question: message.question,
            reveal: null,
            selected: null,
            settled: false,
            progress: { answered: 0, total: previous.players.length },
            gameTotal: message.question.total,
            timePerQuestionMs: message.question.timeLimitMs,
          }))
          return

        case "answerAccepted":
          setState((previous) =>
            previous.question?.index !== message.index
              ? previous
              : { ...previous, selected: message.optionIndex, settled: false }
          )
          return

        case "answerLocked":
          setState((previous) =>
            previous.question?.index === message.index
              ? { ...previous, settled: true }
              : previous
          )
          return

        case "answerProgress":
          setState((previous) => ({
            ...previous,
            progress: { answered: message.answered, total: message.total },
          }))
          return

        case "reveal":
          setState((previous) => ({
            ...previous,
            phase: "reveal",
            reveal: message.reveal,
            gameTotal: message.reveal.total,
          }))
          return

        case "gameEnd":
          setState((previous) => ({
            ...previous,
            phase: "finished",
            result: message.result,
            reveal: null,
            gameTotal: message.result.totalQuestions,
          }))
          return

        case "lobby":
          setState((previous) => ({
            ...previous,
            phase: "lobby",
            players: message.players,
            config: message.config,
            question: null,
            reveal: null,
            result: null,
            selected: null,
            settled: false,
            progress: null,
            gameTotal: null,
          }))
          return

        case "left":
          clearRejoinPending()
          codeRef.current = null
          tokenRef.current = null
          setState((previous) => ({
            ...initialState,
            status: previous.status,
          }))
          return

        case "roomClosed":
          if (codeRef.current) clearToken(codeRef.current)
          clearRejoinPending()
          codeRef.current = null
          tokenRef.current = null
          setState((previous) => ({
            ...initialState,
            status: previous.status,
            error: message.reason,
          }))
          return

        case "error":
          if (rejoinPendingRef.current) {
            resetSession(message.message)
          } else {
            setState((previous) => ({ ...previous, error: message.message }))
          }
          return

        case "pong":
          lastPongAtRef.current = Date.now()
          return
      }
    },
    [clearRejoinPending, resetSession]
  )

  const handleMessageRef = useRef(handleMessage)
  useEffect(() => {
    handleMessageRef.current = handleMessage
  }, [handleMessage])

  const connectRef = useRef<() => void>(() => {})

  const scheduleReconnect = useCallback(() => {
    if (!shouldReconnectRef.current) return
    if (reconnectTimerRef.current !== null) return

    const delay = Math.min(1_000 * 2 ** reconnectAttemptRef.current, 10_000)
    reconnectAttemptRef.current += 1
    reconnectTimerRef.current = window.setTimeout(() => {
      reconnectTimerRef.current = null
      connectRef.current()
    }, delay)
  }, [])

  const connect = useCallback(() => {
    const existing = socketRef.current
    if (
      existing &&
      (existing.readyState === WebSocket.CONNECTING ||
        existing.readyState === WebSocket.OPEN)
    ) {
      return
    }

    if (reconnectTimerRef.current !== null) {
      window.clearTimeout(reconnectTimerRef.current)
      reconnectTimerRef.current = null
    }

    setState((previous) => ({
      ...previous,
      status: previous.code ? "reconnecting" : "connecting",
    }))

    let socket: WebSocket
    try {
      socket = new WebSocket(socketUrl())
    } catch {
      setState((previous) => ({ ...previous, status: "offline" }))
      scheduleReconnect()
      return
    }

    socketRef.current = socket
    lastPongAtRef.current = Date.now()

    // A socket stuck in CONNECTING would never fire close — force a retry.
    if (connectTimeoutRef.current !== null) {
      window.clearTimeout(connectTimeoutRef.current)
    }
    connectTimeoutRef.current = window.setTimeout(() => {
      connectTimeoutRef.current = null
      if (socketRef.current !== socket) return
      if (socket.readyState === WebSocket.CONNECTING) {
        dropSocket()
        scheduleReconnect()
      }
    }, CONNECT_TIMEOUT_MS)

    socket.onopen = () => {
      if (socketRef.current !== socket) return
      if (connectTimeoutRef.current !== null) {
        window.clearTimeout(connectTimeoutRef.current)
        connectTimeoutRef.current = null
      }
      reconnectAttemptRef.current = 0
      lastPongAtRef.current = Date.now()
      setState((previous) => ({ ...previous, status: "connected" }))

      const code = codeRef.current ?? initialCodeRef.current
      const token = tokenRef.current ?? (code ? readToken(code) : null)
      if (!code || !token) return

      rejoinPendingRef.current = true
      if (!sendTo(socket, { type: "rejoin", code, token })) {
        resetSession("Не вдалося відновити сесію")
        return
      }
      if (rejoinTimerRef.current !== null) {
        window.clearTimeout(rejoinTimerRef.current)
      }
      rejoinTimerRef.current = window.setTimeout(() => {
        rejoinTimerRef.current = null
        if (!rejoinPendingRef.current) return
        resetSession("Не вдалося відновити сесію")
      }, REJOIN_TIMEOUT_MS)
    }

    socket.onmessage = (event) => {
      if (socketRef.current !== socket) return
      let message: ServerMessage
      try {
        message = JSON.parse(String(event.data)) as ServerMessage
      } catch {
        return
      }
      handleMessageRef.current(message)
    }

    socket.onclose = () => {
      if (connectTimeoutRef.current !== null) {
        window.clearTimeout(connectTimeoutRef.current)
        connectTimeoutRef.current = null
      }
      clearRejoinPending()
      if (socketRef.current === socket) socketRef.current = null
      if (!shouldReconnectRef.current) return

      setState((previous) => ({
        ...previous,
        status: previous.code ? "reconnecting" : "offline",
      }))
      scheduleReconnect()
    }

    socket.onerror = () => {
      // The close event performs the reconnect scheduling.
    }
  }, [clearRejoinPending, dropSocket, resetSession, scheduleReconnect, sendTo])

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  useEffect(() => {
    shouldReconnectRef.current = true
    const startTimer = window.setTimeout(() => connect(), 0)

    return () => {
      shouldReconnectRef.current = false
      window.clearTimeout(startTimer)
      if (reconnectTimerRef.current !== null) {
        window.clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      clearRejoinPending()
      dropSocket()
    }
  }, [clearRejoinPending, connect, dropSocket])

  // Heartbeat: a half-open connection stays `OPEN` in the browser and would
  // otherwise never throw close/reconnect events.
  useEffect(() => {
    const interval = window.setInterval(() => {
      const socket = socketRef.current
      if (!socket || socket.readyState !== WebSocket.OPEN) return
      const timeout =
        document.visibilityState === "visible"
          ? PONG_TIMEOUT_MS
          : HIDDEN_PONG_TIMEOUT_MS
      if (Date.now() - lastPongAtRef.current > timeout) {
        dropSocket()
        scheduleReconnect()
        return
      }
      sendTo(socket, { type: "ping" })
    }, HEARTBEAT_MS)

    return () => window.clearInterval(interval)
  }, [dropSocket, scheduleReconnect, sendTo])

  // If a question/reveal message was dropped, keep asking until state returns.
  useEffect(() => {
    const needsState =
      state.status === "connected" &&
      Boolean(codeRef.current) &&
      (state.phase === "playing" || state.phase === "reveal") &&
      !state.question
    if (!needsState) return

    send({ type: "resync" })
    const interval = window.setInterval(() => {
      send({ type: "resync" })
    }, RESYNC_DELAY_MS)
    return () => window.clearInterval(interval)
  }, [send, state.phase, state.question, state.status])

  const create = useCallback(
    (name: string) => {
      saveNickname(name)
      send({ type: "create", name })
    },
    [send]
  )

  const join = useCallback(
    (code: string, name: string) => {
      saveNickname(name)
      send({ type: "join", code: code.trim().toUpperCase(), name })
    },
    [send]
  )

  const updateConfig = useCallback(
    (config: Partial<CompetitionConfig>) => {
      send({ type: "updateConfig", config })
    },
    [send]
  )

  const start = useCallback(
    (questions: CompetitionQuestion[]) => {
      send({ type: "start", questions })
    },
    [send]
  )

  const answer = useCallback(
    (index: number, optionIndex: number) => {
      if (!send({ type: "answer", index, optionIndex })) {
        setState((previous) => ({
          ...previous,
          error: "Немає з'єднання з сервером",
        }))
        return
      }
      setState((previous) => ({
        ...previous,
        selected: optionIndex,
        settled: false,
      }))
    },
    [send]
  )

  const settle = useCallback(
    (index: number) => {
      if (!send({ type: "settle", index })) {
        setState((previous) => ({
          ...previous,
          error: "Немає з'єднання з сервером",
        }))
        return
      }
      setState((previous) => ({ ...previous, settled: true }))
    },
    [send]
  )

  const playAgain = useCallback(() => {
    send({ type: "playAgain" })
  }, [send])

  const leave = useCallback(() => {
    send({ type: "leave" })
    if (codeRef.current) clearToken(codeRef.current)
    clearRejoinPending()
    codeRef.current = null
    tokenRef.current = null
    setState((previous) => ({ ...initialState, status: previous.status }))
  }, [clearRejoinPending, send])

  const clearError = useCallback(() => {
    setState((previous) => ({ ...previous, error: null }))
  }, [])

  const reconnect = useCallback(() => {
    reconnectAttemptRef.current = 0
    dropSocket()
    connect()
  }, [connect, dropSocket])

  return {
    ...state,
    isHost: Boolean(state.playerId && state.playerId === state.hostId),
    create,
    join,
    updateConfig,
    start,
    answer,
    settle,
    playAgain,
    leave,
    clearError,
    reconnect,
  }
}

export type CompetitionController = ReturnType<typeof useCompetition>
