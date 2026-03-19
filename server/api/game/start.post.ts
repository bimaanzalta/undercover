import { queryOne, execute, query } from '~/server/utils/db'
import { broadcastToRoom } from '~/server/utils/sse'
import { assignRolesAndWords, getCurrentTurnPlayerId } from '~/server/utils/game'
import type { Room, Player } from '~/server/utils/game'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.roomId || !body?.sessionId) {
    throw createError({ statusCode: 400, message: 'roomId and sessionId are required' })
  }

  const roomId = String(body.roomId).toUpperCase()
  const sessionId = String(body.sessionId)

  // Get room
  const room = await queryOne<Room>('SELECT * FROM rooms WHERE id = ?', [roomId])
  if (!room) {
    throw createError({ statusCode: 404, message: 'Room tidak ditemukan' })
  }

  if (room.status !== 'lobby') {
    throw createError({ statusCode: 400, message: 'Game sudah dimulai' })
  }

  // Verify host
  const players = await query<Player>('SELECT * FROM players WHERE room_id = ? ORDER BY id ASC', [roomId])
  if (players.length < 4) {
    throw createError({ statusCode: 400, message: 'Minimal 4 pemain untuk memulai game' })
  }

  const hostPlayer = players[0]
  if (hostPlayer.session_id !== sessionId) {
    throw createError({ statusCode: 403, message: 'Hanya host yang bisa memulai game' })
  }

  // Update room status
  await execute('UPDATE rooms SET status = ? WHERE id = ?', ['playing', roomId])

  // Create game record
  const gameResult = await execute(
    'INSERT INTO games (room_id, round_num, phase) VALUES (?, 1, ?)',
    [roomId, 'clue']
  )
  const gameId = gameResult.insertId

  // Assign roles and words
  await assignRolesAndWords(roomId, gameId)

  // Get updated players with roles
  const updatedPlayers = await query<Player>(
    'SELECT * FROM players WHERE room_id = ?',
    [roomId]
  )

  // Get game details
  const game = await queryOne('SELECT * FROM games WHERE id = ?', [gameId])

  // Broadcast game_started with private words per player
  // The client will use their own playerId to get their word
  const playerData = updatedPlayers.map(p => ({
    id: p.id,
    name: p.name,
    is_eliminated: p.is_eliminated,
    // Only send role/word to the specific player (filter on client side via playerId)
    role: p.role,
    word: p.word
  }))

  const firstTurnPlayerId = await getCurrentTurnPlayerId(roomId, gameId, 1)

  broadcastToRoom(roomId, 'game_started', {
    gameId,
    roomId,
    players: playerData,
    currentTurnPlayerId: firstTurnPlayerId,
    game: {
      id: gameId,
      round_num: 1,
      phase: 'clue'
    }
  })

  return {
    gameId,
    success: true
  }
})
