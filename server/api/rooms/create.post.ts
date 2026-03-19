import { v4 as uuidv4 } from 'uuid'
import { execute, query } from '~/server/utils/db'
import { broadcastToRoom } from '~/server/utils/sse'

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.hostName || typeof body.hostName !== 'string') {
    throw createError({
      statusCode: 400,
      message: 'hostName is required'
    })
  }

  const hostName = body.hostName.trim().slice(0, 50)
  if (!hostName) {
    throw createError({
      statusCode: 400,
      message: 'hostName cannot be empty'
    })
  }

  // Generate unique room ID
  let roomId = generateRoomId()
  let attempts = 0
  while (attempts < 10) {
    const existing = await query('SELECT id FROM rooms WHERE id = ?', [roomId])
    if (existing.length === 0) break
    roomId = generateRoomId()
    attempts++
  }

  const sessionId = uuidv4()

  // Create room
  await execute(
    'INSERT INTO rooms (id, host_name, status) VALUES (?, ?, ?)',
    [roomId, hostName, 'lobby']
  )

  // Create host player
  const result = await execute(
    'INSERT INTO players (room_id, name, session_id) VALUES (?, ?, ?)',
    [roomId, hostName, sessionId]
  )

  const playerId = result.insertId

  // Set session cookie
  setCookie(event, 'session_id', sessionId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24, // 24 hours
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

  // Broadcast room created (no one listening yet, but good practice)
  broadcastToRoom(roomId, 'room_created', {
    roomId,
    hostName,
    playerId
  })

  return {
    roomId,
    playerId,
    sessionId,
    hostName
  }
})
