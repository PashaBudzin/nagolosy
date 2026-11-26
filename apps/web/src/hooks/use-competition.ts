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
  selected: number | null
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
  progress: null,
  gameTotal: null,
  timePerQuestionMs: null,
}

const TOKEN_PREFIX = "nagolosy-competition-"
const NICKNAME_KEY = "nagolosy-competition-nickname"

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
  return `${protocol}//${window.location.host}/ws`
}

export function useCompetition(roomCode = "") {
  const [state, setState] = useState<CompetitionState>(initialState)
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptRef = useRef(0)
  const shouldReconnectRef = useRef(true)
  const codeRef = useRef<string | null>(null)
  const tokenRef = useRef<string | null>(null)
  const initialCodeRef = useRef(roomCode.trim().toUpperCase())

  useEffect(() => {
    if (!codeRef.current) {
      initialCodeRef.current = roomCode.trim().toUpperCase()
    }
  }, [roomCode])

  const sendTo = useCallback((socket: WebSocket, message: ClientMessage) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message))
    }
  }, [])

  const send = useCallback(
    (message: ClientMessage) => {
      const socket = socketRef.current
      if (socket) sendTo(socket, message)
    },
    [sendTo]
  )

  const handleMessage = useCallback((message: ServerMessage) => {
    switch (message.type) {
      case "welcome": {
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
          progress: { answered: 0, total: previous.players.length },
          gameTotal: message.question.total,
          timePerQuestionMs: message.question.timeLimitMs,
        }))
        return

      case "answerAccepted":
        setState((previous) => ({
          ...previous,
          selected: message.optionIndex,
        }))
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
          progress: null,
          gameTotal: null,
        }))
        return

      case "left":
        codeRef.current = null
        tokenRef.current = null
        setState((previous) => ({
          ...initialState,
          status: previous.status,
        }))
        return

      case "roomClosed":
        if (codeRef.current) clearToken(codeRef.current)
        codeRef.current = null
        tokenRef.current = null
        setState((previous) => ({
          ...initialState,
          status: previous.status,
          error: message.reason,
        }))
        return

      case "error":
        setState((previous) => ({ ...previous, error: message.message }))
        return

      case "pong":
        return
    }
  }, [])

  const handleMessageRef = useRef(handleMessage)
  useEffect(() => {
    handleMessageRef.current = handleMessage
  }, [handleMessage])

  const connectRef = useRef<() => void>(() => {})

  const scheduleReconnect = useCallback(() => {
    if (!shouldReconnectRef.current) return
    if (reconnectTimerRef.current) return

    const delay = Math.min(1_000 * 2 ** reconnectAttemptRef.current, 10_000)
    reconnectAttemptRef.current += 1
    reconnectTimerRef.current = setTimeout(() => {
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

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current)
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

    socket.onopen = () => {
      reconnectAttemptRef.current = 0
      setState((previous) => ({ ...previous, status: "connected" }))

      const code = codeRef.current ?? initialCodeRef.current
      const token = tokenRef.current ?? (code ? readToken(code) : null)
      if (code && token) {
        sendTo(socket, { type: "rejoin", code, token })
      }
    }

    socket.onmessage = (event) => {
      let message: ServerMessage
      try {
        message = JSON.parse(String(event.data)) as ServerMessage
      } catch {
        return
      }
      handleMessageRef.current(message)
    }

    socket.onclose = () => {
      if (socketRef.current === socket) socketRef.current = null
      if (!shouldReconnectRef.current) return

      setState((previous) => ({
        ...previous,
        status: previous.code ? "reconnecting" : "offline",
      }))
      scheduleReconnect()
    }

    socket.onerror = () => {
      // The close event that follows performs the reconnect scheduling.
    }
  }, [scheduleReconnect, sendTo])

  useEffect(() => {
    connectRef.current = connect
  }, [connect])

  useEffect(() => {
    shouldReconnectRef.current = true
    const startTimer = window.setTimeout(() => connect(), 0)

    return () => {
      shouldReconnectRef.current = false
      window.clearTimeout(startTimer)
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      const socket = socketRef.current
      socketRef.current = null
      socket?.close(1000, "Component unmounted")
    }
  }, [connect])

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
      setState((previous) => {
        if (previous.selected !== null) return previous
        return { ...previous, selected: optionIndex }
      })
      send({ type: "answer", index, optionIndex })
    },
    [send]
  )

  const playAgain = useCallback(() => {
    send({ type: "playAgain" })
  }, [send])

  const leave = useCallback(() => {
    send({ type: "leave" })
    if (codeRef.current) clearToken(codeRef.current)
    codeRef.current = null
    tokenRef.current = null
    setState((previous) => ({ ...initialState, status: previous.status }))
  }, [send])

  const clearError = useCallback(() => {
    setState((previous) => ({ ...previous, error: null }))
  }, [])

  const reconnect = useCallback(() => {
    reconnectAttemptRef.current = 0
    connect()
  }, [connect])

  return {
    ...state,
    isHost: Boolean(state.playerId && state.playerId === state.hostId),
    create,
    join,
    updateConfig,
    start,
    answer,
    playAgain,
    leave,
    clearError,
    reconnect,
  }
}

export type CompetitionController = ReturnType<typeof useCompetition>
