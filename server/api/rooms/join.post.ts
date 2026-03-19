import { v4 as uuidv4 } from 'uuid'
import { queryOne, execute, query } from '~/server/utils/db'
import { broadcastToRoom } from '~/server/utils/sse'
import type { Room, Player } from '~/server/utils/game'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.roomId || !body?.playerName) {
    throw createError({
      statusCode: 400,
      message: 'roomId and playerName are required'
    })
  }

  const roomId = String(body.roomId).trim().toUpperCase()
  const playerName = String(body.playerName).trim().slice(0, 50)

  if (!playerName) {
    throw createError({ statusCode: 400, message: 'playerName cannot be empty' })
  }

  // Check room exists
  const room = await queryOne<Room>('SELECT * FROM rooms WHERE id = ?', [roomId])

  if (!room) {
    throw createError({ statusCode: 404, message: 'Room tidak ditemukan' })
  }

  if (room.status !== 'lobby') {
    throw createError({ statusCode: 400, message: 'Game sudah dimulai atau selesai' })
  }

  // Check player count
  const players = await query<Player>('SELECT * FROM players WHERE room_id = ?', [roomId])

  if (players.length >= 12) {
    throw createError({ statusCode: 400, message: 'Room sudah penuh (maksimal 12 pemain)' })
  }

  // Check duplicate name
  const existing = players.find(p => p.name.toLowerCase() === playerName.toLowerCase())
  if (existing) {
    throw createError({ statusCode: 400, message: 'Nama sudah digunakan di room ini' })
  }

  const sessionId = uuidv4()

  const result = await execute(
    'INSERT INTO players (room_id, name, session_id) VALUES (?, ?, ?)',
    [roomId, playerName, sessionId]
  )

  const playerId = result.insertId

  // Set cookies
  setCookie(event, 'session_id', sessionId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24,
    path: '/',
    sameSite: 'lax'
  })

  setCookie(event, 'player_id', String(playerId), {
    httpOnly: false,
    maxAge: 60 * 60 * 24,
    path: '/',
    sameSite: 'lax'
  })

  setCookie(event, 'room_id', roomId, {
    httpOnly: false,
    maxAge: 60 * 60 * 24,
    path: '/',
    sameSite: 'lax'
  })

  // Broadcast to room
  const updatedPlayers = await query<Player>(
    'SELECT id, name, is_eliminated FROM players WHERE room_id = ? ORDER BY id ASC',
    [roomId]
  )

  broadcastToRoom(roomId, 'player_joined', {
    playerId,
    playerName,
    players: updatedPlayers
  })

  return {
    roomId,
    playerId,
    sessionId,
    playerName
  }
})
