import { queryOne, execute, query } from '~/server/utils/db'
import { broadcastToRoom } from '~/server/utils/sse'
import { getCurrentTurnPlayerId } from '~/server/utils/game'
import type { Game, Player } from '~/server/utils/game'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.gameId || !body?.sessionId) {
    throw createError({ statusCode: 400, message: 'gameId and sessionId are required' })
  }

  const gameId = parseInt(body.gameId)
  const sessionId = String(body.sessionId)

  const game = await queryOne<Game>('SELECT * FROM games WHERE id = ?', [gameId])
  if (!game) {
    throw createError({ statusCode: 404, message: 'Game tidak ditemukan' })
  }

  if (game.phase !== 'result') {
    throw createError({ statusCode: 400, message: 'Bukan fase result' })
  }

  // Verify host (first player in room)
  const players = await query<Player>(
    'SELECT * FROM players WHERE room_id = ? ORDER BY id ASC',
    [game.room_id]
  )

  const hostPlayer = players[0]
  if (hostPlayer.session_id !== sessionId) {
    throw createError({ statusCode: 403, message: 'Hanya host yang bisa melanjutkan' })
  }

  const nextRound = game.round_num + 1

  await execute(
    'UPDATE games SET round_num = ?, phase = ?, clues_submitted = 0, votes_submitted = 0 WHERE id = ?',
    [nextRound, 'clue', gameId]
  )

  const activePlayers = await query<Player>(
    'SELECT id, name, is_eliminated FROM players WHERE room_id = ? AND is_eliminated = 0',
    [game.room_id]
  )

  const firstTurnPlayerId = await getCurrentTurnPlayerId(game.room_id, gameId, nextRound)

  broadcastToRoom(game.room_id, 'next_round', {
    round: nextRound,
    phase: 'clue',
    activePlayers,
    currentTurnPlayerId: firstTurnPlayerId
  })

  return { success: true, round: nextRound }
})
