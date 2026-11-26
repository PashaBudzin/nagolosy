import { randomUUID } from "node:crypto"
import type { Server } from "node:http"
import { WebSocket, WebSocketServer } from "ws"
import type {
  ClientMessage,
  CompetitionAnswer,
  CompetitionCategory,
  CompetitionConfig,
  CompetitionPhase,
  CompetitionPlayer,
  CompetitionQuestion,
  CompetitionQuestionPayload,
  CompetitionResult,
  CompetitionReveal,
  LeaderboardEntry,
  ServerMessage,
  WelcomeMessage,
} from "./protocol.ts"

const MAX_PLAYERS = 10
const MIN_PLAYERS = 2
const MAX_QUESTIONS = 30
const MAX_ROOMS = 500
const REVEAL_PAUSE_MS = 4_500
const FINAL_PAUSE_MS = 5_000
const EMPTY_ROOM_TTL_MS = 5 * 60 * 1000
const TICK_MS = 250
const EARLY_REVEAL_MS = 350
const STALE_SOCKET_MS = 150_000
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
const CODE_LENGTH = 4

const DEFAULT_CONFIG: CompetitionConfig = {
  category: "words",
  groupId: "all",
  questionCount: 10,
  timePerQuestionMs: 15_000,
}

const CATEGORIES = new Set<CompetitionCategory>([
  "words",
  "idioms",
  "history",
  "terms",
])

interface PlayerAnswer {
  optionIndex: number
  correct: boolean
  /** Elapsed time when the answer was locked in (used for the speed bonus). */
  timeMs: number
}

interface RoomPlayer {
  id: string
  token: string
  name: string
  socket: WebSocket | null
  connected: boolean
  score: number
  correct: number
  totalTimeMs: number
  /** Current selection — still editable until `settled`. */
  answer: PlayerAnswer | null
  settled: boolean
}

interface Room {
  code: string
  hostId: string
  phase: CompetitionPhase
  config: CompetitionConfig
  players: Map<string, RoomPlayer>
  questions: CompetitionQuestion[]
  currentIndex: number
  questionStartedAt: number
  timeLimitMs: number
  /** Absolute timestamp for the next phase transition. */
  phaseDeadline: number
  /** When the room first became empty, for idle cleanup. */
  emptySince: number | null
  revealPayload: CompetitionReveal | null
  resultPayload: CompetitionResult | null
}

interface ClientMeta {
  code: string | null
  playerId: string | null
  lastSeen: number
}

const rooms = new Map<string, Room>()
const clients = new Map<WebSocket, ClientMeta>()

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return ""
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength)
}

function cleanName(value: unknown): string {
  return cleanText(value, 24) || "Гравець"
}

function cleanCode(value: unknown): string {
  return cleanText(value, 12)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, CODE_LENGTH)
}

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

function cleanConfig(raw: unknown, base: CompetitionConfig): CompetitionConfig {
  if (!isRecord(raw)) return base

  const category =
    typeof raw.category === "string" &&
    CATEGORIES.has(raw.category as CompetitionCategory)
      ? (raw.category as CompetitionCategory)
      : base.category

  let groupId: number | "all" = base.groupId
  if (raw.groupId === "all") {
    groupId = "all"
  } else if (
    typeof raw.groupId === "number" &&
    Number.isInteger(raw.groupId) &&
    raw.groupId >= 0
  ) {
    groupId = raw.groupId
  }

  return {
    category,
    groupId,
    questionCount: clampInt(
      raw.questionCount,
      3,
      MAX_QUESTIONS,
      base.questionCount
    ),
    timePerQuestionMs: clampInt(
      raw.timePerQuestionMs,
      5_000,
      120_000,
      base.timePerQuestionMs
    ),
  }
}

function parseQuestions(raw: unknown): CompetitionQuestion[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_QUESTIONS) {
    return null
  }

  const parsed: CompetitionQuestion[] = []
  for (const item of raw) {
    if (!isRecord(item)) return null

    const prompt = cleanText(item.prompt, 400)
    if (!prompt) return null

    const hint = cleanText(item.hint, 300)

    if (
      !Array.isArray(item.options) ||
      item.options.length < 2 ||
      item.options.length > 6
    ) {
      return null
    }
    const options = item.options.map((option) => cleanText(option, 400))
    if (options.some((option) => !option)) return null

    const correctIndex = item.correctIndex
    if (
      typeof correctIndex !== "number" ||
      !Number.isInteger(correctIndex) ||
      correctIndex < 0 ||
      correctIndex >= options.length
    ) {
      return null
    }

    parsed.push({
      prompt,
      ...(hint ? { hint } : {}),
      options,
      correctIndex,
    })
  }

  return parsed
}

function send(socket: WebSocket, message: ServerMessage) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(message))
  }
}

function broadcast(room: Room, message: ServerMessage) {
  for (const player of room.players.values()) {
    if (player.socket) send(player.socket, message)
  }
}

function connectedPlayers(room: Room): RoomPlayer[] {
  return [...room.players.values()].filter((player) => player.connected)
}

function playerList(room: Room): CompetitionPlayer[] {
  return [...room.players.values()].map((player) => ({
    id: player.id,
    name: player.name,
    score: player.score,
    correct: player.correct,
    totalTimeMs: player.totalTimeMs,
    connected: player.connected,
  }))
}

function leaderboard(room: Room): LeaderboardEntry[] {
  return [...room.players.values()]
    .map((player) => ({
      playerId: player.id,
      name: player.name,
      score: player.score,
      correct: player.correct,
      totalTimeMs: player.totalTimeMs,
      connected: player.connected,
    }))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.correct - a.correct ||
        a.totalTimeMs - b.totalTimeMs ||
        a.name.localeCompare(b.name)
    )
}

function broadcastPlayers(room: Room) {
  broadcast(room, {
    type: "players",
    hostId: room.hostId,
    players: playerList(room),
  })
}

function remainingMs(room: Room): number {
  return Math.max(0, room.timeLimitMs - (Date.now() - room.questionStartedAt))
}

function questionPayload(room: Room): CompetitionQuestionPayload | undefined {
  const question = room.questions[room.currentIndex]
  if (!question) return undefined

  return {
    index: room.currentIndex,
    total: room.questions.length,
    prompt: question.prompt,
    ...(question.hint ? { hint: question.hint } : {}),
    options: question.options,
    timeLimitMs: room.timeLimitMs,
    remainingMs: room.phase === "playing" ? remainingMs(room) : 0,
  }
}

function answerProgress(room: Room) {
  const active = connectedPlayers(room)
  return {
    answered: active.filter((player) => player.settled).length,
    total: active.length,
  }
}

function welcomeFor(room: Room, player: RoomPlayer): WelcomeMessage {
  const welcome: WelcomeMessage = {
    type: "welcome",
    code: room.code,
    playerId: player.id,
    token: player.token,
    hostId: room.hostId,
    phase: room.phase,
    players: playerList(room),
    config: room.config,
    answeredCount: answerProgress(room),
  }

  if (room.phase === "playing" || room.phase === "reveal") {
    const payload = questionPayload(room)
    if (payload) welcome.question = payload
    welcome.selected = player.answer?.optionIndex ?? null
    welcome.settled = player.settled
  }

  if (room.phase === "reveal" && room.revealPayload) {
    welcome.reveal = room.revealPayload
  }

  if (room.phase === "finished" && room.resultPayload) {
    welcome.result = room.resultPayload
  }

  return welcome
}

function deleteRoom(room: Room, reason?: string) {
  rooms.delete(room.code)

  for (const player of room.players.values()) {
    if (!player.socket) continue
    const socket = player.socket
    clients.delete(socket)
    if (reason) {
      send(socket, { type: "roomClosed", reason })
      socket.close(4000, "Room closed")
    }
  }
}

function promoteHost(room: Room) {
  const current = room.players.get(room.hostId)
  if (current?.connected) return

  const next = connectedPlayers(room)[0]
  if (next) room.hostId = next.id
}

function removePlayer(room: Room, player: RoomPlayer) {
  room.players.delete(player.id)
  if (player.socket) clients.delete(player.socket)

  if (room.players.size === 0) {
    deleteRoom(room)
    return
  }

  promoteHost(room)
  broadcastPlayers(room)
}

function markDisconnected(room: Room, player: RoomPlayer) {
  player.socket = null
  player.connected = false

  if (room.phase === "lobby") {
    removePlayer(room, player)
    return
  }

  // Leaving mid-round commits whatever was selected at that moment.
  if (room.phase === "playing" && player.answer && !player.settled) {
    player.settled = true
    player.answer.timeMs = Math.min(
      room.timeLimitMs,
      Math.max(0, Date.now() - room.questionStartedAt)
    )
  }

  promoteHost(room)
  broadcastPlayers(room)

  // Losing the last unsettled player may unblock an early reveal.
  maybeScheduleReveal(room)
}

function makeCode(): string {
  for (let attempt = 0; attempt < 50; attempt++) {
    let code = ""
    for (let i = 0; i < CODE_LENGTH; i++) {
      code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]
    }
    if (!rooms.has(code)) return code
  }
  return randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()
}

function createRoom(config: CompetitionConfig): Room {
  return {
    code: makeCode(),
    hostId: "",
    phase: "lobby",
    config,
    players: new Map(),
    questions: [],
    currentIndex: 0,
    questionStartedAt: 0,
    timeLimitMs: config.timePerQuestionMs,
    phaseDeadline: 0,
    emptySince: null,
    revealPayload: null,
    resultPayload: null,
  }
}

function addPlayer(room: Room, name: string, socket: WebSocket): RoomPlayer {
  const player: RoomPlayer = {
    id: randomUUID(),
    token: randomUUID(),
    name,
    socket,
    connected: true,
    score: 0,
    correct: 0,
    totalTimeMs: 0,
    answer: null,
    settled: false,
  }
  room.players.set(player.id, player)
  const meta = getMeta(socket)
  meta.code = room.code
  meta.playerId = player.id
  return player
}

function getMeta(socket: WebSocket): ClientMeta {
  let meta = clients.get(socket)
  if (!meta) {
    meta = { code: null, playerId: null, lastSeen: Date.now() }
    clients.set(socket, meta)
  }
  return meta
}

function currentRoom(socket: WebSocket): {
  room: Room
  player: RoomPlayer
} | null {
  const meta = clients.get(socket)
  if (!meta?.code || !meta.playerId) return null

  const room = rooms.get(meta.code)
  const player = room?.players.get(meta.playerId)
  if (!room || !player) return null

  return { room, player }
}

function askQuestion(room: Room) {
  const question = room.questions[room.currentIndex]
  if (!question) {
    finishGame(room)
    return
  }

  room.phase = "playing"
  room.questionStartedAt = Date.now()
  room.timeLimitMs = room.config.timePerQuestionMs
  room.phaseDeadline = room.questionStartedAt + room.timeLimitMs
  for (const player of room.players.values()) {
    player.answer = null
    player.settled = false
  }

  const payload = questionPayload(room)
  if (!payload) {
    finishGame(room)
    return
  }

  broadcast(room, { type: "question", question: payload })
  broadcast(room, {
    type: "answerProgress",
    answered: 0,
    total: connectedPlayers(room).length,
  })
}

function maybeScheduleReveal(room: Room) {
  if (room.phase !== "playing") return

  const active = connectedPlayers(room)
  if (active.length === 0 || !active.every((player) => player.settled)) return

  room.phaseDeadline = Math.min(
    room.phaseDeadline,
    Date.now() + EARLY_REVEAL_MS
  )
}

function revealCurrent(room: Room) {
  if (room.phase !== "playing") return

  const question = room.questions[room.currentIndex]
  if (!question) {
    finishGame(room)
    return
  }

  const answers: CompetitionAnswer[] = []
  for (const player of room.players.values()) {
    const answer = player.answer
    // An unconfirmed selection is settled automatically at the deadline, with
    // no speed bonus.
    const timeMs = answer
      ? player.settled
        ? answer.timeMs
        : room.timeLimitMs
      : null
    let delta = 0

    if (answer?.correct) {
      const remaining = Math.max(0, room.timeLimitMs - (timeMs ?? 0))
      delta = 100 + Math.round((99 * remaining) / room.timeLimitMs)
      player.score += delta
      player.correct += 1
    }

    player.totalTimeMs += timeMs ?? room.timeLimitMs

    answers.push({
      playerId: player.id,
      name: player.name,
      selected: answer?.optionIndex ?? null,
      correct: answer?.correct ?? false,
      delta,
      timeMs,
    })
  }

  room.phase = "reveal"
  const isLast = room.currentIndex + 1 >= room.questions.length
  const reveal: CompetitionReveal = {
    index: room.currentIndex,
    total: room.questions.length,
    correctIndex: question.correctIndex,
    correctText: question.options[question.correctIndex],
    answers,
    leaderboard: leaderboard(room),
    nextInMs: isLast ? FINAL_PAUSE_MS : REVEAL_PAUSE_MS,
  }

  room.revealPayload = reveal
  broadcast(room, { type: "reveal", reveal })
  broadcastPlayers(room)

  room.phaseDeadline = Date.now() + reveal.nextInMs
}

/** Advance out of the reveal phase. Safe to call repeatedly / late. */
function advanceAfterReveal(room: Room) {
  if (room.phase !== "reveal") return

  if (room.currentIndex + 1 >= room.questions.length) {
    finishGame(room)
  } else {
    room.currentIndex += 1
    askQuestion(room)
  }
}

/**
 * Single periodic driver for every room. A lost or delayed timer can no longer
 * strand a game in `playing` or `reveal`; the deadline is re-checked each tick.
 */
function tickRooms() {
  const now = Date.now()

  for (const room of rooms.values()) {
    if (room.phase === "playing" && now >= room.phaseDeadline) {
      revealCurrent(room)
    } else if (room.phase === "reveal" && now >= room.phaseDeadline) {
      advanceAfterReveal(room)
    }

    if (connectedPlayers(room).length === 0) {
      if (room.emptySince === null) room.emptySince = now
      else if (now - room.emptySince >= EMPTY_ROOM_TTL_MS) {
        deleteRoom(room, "Кімната закрита через неактивність")
      }
    } else {
      room.emptySince = null
    }
  }

  // Drop sockets that stopped answering heartbeats (half-open connections).
  // The close handler performs the actual player/room cleanup.
  for (const [socket, meta] of clients) {
    if (now - meta.lastSeen > STALE_SOCKET_MS) socket.terminate()
  }
}

function finishGame(room: Room) {
  room.phase = "finished"
  room.phaseDeadline = 0
  room.revealPayload = null

  const result: CompetitionResult = {
    totalQuestions: room.questions.length,
    leaderboard: leaderboard(room),
  }
  room.resultPayload = result

  broadcast(room, { type: "gameEnd", result })
  broadcastPlayers(room)
}

function resetToLobby(room: Room) {
  room.phase = "lobby"
  room.phaseDeadline = 0
  room.questions = []
  room.currentIndex = 0
  room.revealPayload = null
  room.resultPayload = null

  for (const player of room.players.values()) {
    player.score = 0
    player.correct = 0
    player.totalTimeMs = 0
    player.answer = null
    player.settled = false
  }

  broadcast(room, {
    type: "lobby",
    players: playerList(room),
    config: room.config,
  })
}

export function attachRealtime(
  server: Server,
  path = "/api/ws"
): WebSocketServer {
  const wss = new WebSocketServer({ server, path })
  const tick = setInterval(tickRooms, TICK_MS)

  wss.on("close", () => {
    clearInterval(tick)
  })

  wss.on("connection", (socket) => {
    getMeta(socket)

    socket.on("message", (data) => {
      getMeta(socket).lastSeen = Date.now()
      let message: ClientMessage
      try {
        message = JSON.parse(data.toString()) as ClientMessage
      } catch {
        send(socket, { type: "error", message: "Некоректне повідомлення" })
        return
      }

      if (!isRecord(message) || typeof message.type !== "string") {
        send(socket, { type: "error", message: "Некоректне повідомлення" })
        return
      }

      handleMessage(socket, message)
    })

    socket.on("close", () => {
      const meta = clients.get(socket)
      clients.delete(socket)
      if (!meta?.code || !meta.playerId) return

      const room = rooms.get(meta.code)
      const player = room?.players.get(meta.playerId)
      if (!room || !player) return
      if (player.socket !== socket) return

      markDisconnected(room, player)
    })

    socket.on("error", () => {
      // The close handler takes care of cleanup.
    })
  })

  return wss
}

function handleMessage(socket: WebSocket, message: ClientMessage) {
  switch (message.type) {
    case "create": {
      const meta = getMeta(socket)
      if (meta.code) {
        send(socket, { type: "error", message: "Ви вже перебуваєте в кімнаті" })
        return
      }
      if (rooms.size >= MAX_ROOMS) {
        send(socket, {
          type: "error",
          message: "Сервер перевантажений, спробуйте пізніше",
        })
        return
      }

      const room = createRoom(cleanConfig(message.config, DEFAULT_CONFIG))
      const player = addPlayer(room, cleanName(message.name), socket)
      room.hostId = player.id
      rooms.set(room.code, room)

      send(socket, welcomeFor(room, player))
      return
    }

    case "join": {
      const meta = getMeta(socket)
      if (meta.code) {
        send(socket, { type: "error", message: "Ви вже перебуваєте в кімнаті" })
        return
      }

      const code = cleanCode(message.code)
      const room = rooms.get(code)
      if (!room) {
        send(socket, { type: "error", message: "Кімнату не знайдено" })
        return
      }
      if (room.phase !== "lobby") {
        send(socket, { type: "error", message: "Гра вже почалася" })
        return
      }
      if (room.players.size >= MAX_PLAYERS) {
        send(socket, { type: "error", message: "У кімнаті вже 10 гравців" })
        return
      }

      const player = addPlayer(room, cleanName(message.name), socket)
      send(socket, welcomeFor(room, player))
      broadcastPlayers(room)
      return
    }

    case "rejoin": {
      const meta = getMeta(socket)
      if (meta.code) {
        send(socket, { type: "error", message: "Ви вже перебуваєте в кімнаті" })
        return
      }

      const code = cleanCode(message.code)
      const room = rooms.get(code)
      if (!room) {
        send(socket, { type: "error", message: "Кімната більше не існує" })
        return
      }

      const player = [...room.players.values()].find(
        (candidate) => candidate.token === message.token
      )
      if (!player) {
        send(socket, { type: "error", message: "Не вдалося відновити сесію" })
        return
      }

      const previous = player.socket
      if (previous && previous !== socket) {
        clients.delete(previous)
        previous.close(4001, "Reconnected elsewhere")
      }

      player.socket = socket
      player.connected = true
      meta.code = room.code
      meta.playerId = player.id
      meta.lastSeen = Date.now()

      room.emptySince = null

      promoteHost(room)
      send(socket, welcomeFor(room, player))
      broadcastPlayers(room)
      return
    }

    case "leave": {
      const context = currentRoom(socket)
      const meta = getMeta(socket)
      meta.code = null
      meta.playerId = null

      send(socket, { type: "left" })
      if (context) removePlayer(context.room, context.player)
      return
    }

    case "updateConfig": {
      const context = currentRoom(socket)
      if (!context) {
        send(socket, { type: "error", message: "Ви не в кімнаті" })
        return
      }
      const { room, player } = context
      if (room.hostId !== player.id) {
        send(socket, {
          type: "error",
          message: "Налаштування змінює організатор",
        })
        return
      }
      if (room.phase !== "lobby") {
        send(socket, { type: "error", message: "Гра вже почалася" })
        return
      }

      room.config = cleanConfig(message.config, room.config)
      broadcast(room, { type: "config", config: room.config })
      return
    }

    case "start": {
      const context = currentRoom(socket)
      if (!context) {
        send(socket, { type: "error", message: "Ви не в кімнаті" })
        return
      }
      const { room, player } = context
      if (room.hostId !== player.id) {
        send(socket, { type: "error", message: "Гру запускає організатор" })
        return
      }
      if (room.phase !== "lobby") {
        send(socket, { type: "error", message: "Гра вже почалася" })
        return
      }
      if (connectedPlayers(room).length < MIN_PLAYERS) {
        send(socket, { type: "error", message: "Потрібно щонайменше 2 гравці" })
        return
      }

      const questions = parseQuestions(message.questions)
      if (!questions) {
        send(socket, {
          type: "error",
          message: "Не вдалося підготувати питання",
        })
        return
      }

      room.questions = questions
      room.currentIndex = 0
      room.config = {
        ...room.config,
        questionCount: questions.length,
        timePerQuestionMs: clampInt(
          room.config.timePerQuestionMs,
          5_000,
          120_000,
          room.config.timePerQuestionMs
        ),
      }
      room.timeLimitMs = room.config.timePerQuestionMs
      room.revealPayload = null
      room.resultPayload = null

      for (const roomPlayer of room.players.values()) {
        roomPlayer.score = 0
        roomPlayer.correct = 0
        roomPlayer.totalTimeMs = 0
        roomPlayer.answer = null
        roomPlayer.settled = false
      }

      broadcast(room, {
        type: "gameStarted",
        total: questions.length,
        timePerQuestionMs: room.config.timePerQuestionMs,
      })
      askQuestion(room)
      return
    }

    case "answer": {
      const context = currentRoom(socket)
      if (!context) return

      const { room, player } = context
      if (room.phase !== "playing") return
      if (message.index !== room.currentIndex) return
      if (player.settled) return

      const question = room.questions[room.currentIndex]
      if (!question) return
      if (
        typeof message.optionIndex !== "number" ||
        !Number.isInteger(message.optionIndex) ||
        message.optionIndex < 0 ||
        message.optionIndex >= question.options.length
      ) {
        return
      }

      // The speed bonus is measured when the answer is locked in, not when it
      // is first selected — changing your mind must not buy extra time.
      player.answer = {
        optionIndex: message.optionIndex,
        correct: message.optionIndex === question.correctIndex,
        timeMs: 0,
      }

      send(socket, {
        type: "answerAccepted",
        index: room.currentIndex,
        optionIndex: message.optionIndex,
      })
      broadcast(room, {
        type: "answerProgress",
        ...answerProgress(room),
      })
      return
    }

    case "settle": {
      const context = currentRoom(socket)
      if (!context) return

      const { room, player } = context
      if (room.phase !== "playing") return
      if (message.index !== room.currentIndex) return
      if (player.settled || !player.answer) return

      player.settled = true
      player.answer.timeMs = Math.min(
        room.timeLimitMs,
        Math.max(0, Date.now() - room.questionStartedAt)
      )

      send(socket, { type: "answerLocked", index: room.currentIndex })
      broadcast(room, {
        type: "answerProgress",
        ...answerProgress(room),
      })
      maybeScheduleReveal(room)
      return
    }

    case "resync": {
      const context = currentRoom(socket)
      if (!context) return

      send(socket, welcomeFor(context.room, context.player))
      return
    }

    case "playAgain": {
      const context = currentRoom(socket)
      if (!context) return
      const { room, player } = context
      if (room.hostId !== player.id) {
        send(socket, {
          type: "error",
          message: "Нову гру запускає організатор",
        })
        return
      }
      if (room.phase !== "finished") return

      resetToLobby(room)
      return
    }

    case "ping": {
      send(socket, { type: "pong" })
      return
    }

    default: {
      send(socket, { type: "error", message: "Невідома команда" })
    }
  }
}
