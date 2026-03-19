import { queryOne, query } from '~/server/utils/db'
import { getCurrentTurnPlayerId } from '~/server/utils/game'
import type { Room, Player } from '~/server/utils/game'

export default defineEventHandler(async (event) => {
  const roomId = getRouterParam(event, 'id')

  if (!roomId) {
    throw createError({ statusCode: 400, message: 'Room ID is required' })
  }

  const room = await queryOne<Room>(
    'SELECT * FROM rooms WHERE id = ?',
    [roomId.toUpperCase()]
  )

  if (!room) {
    throw createError({ statusCode: 404, message: 'Room not found' })
  }

  const players = await query<Player>(
    'SELECT id, room_id, name, is_eliminated FROM players WHERE room_id = ? ORDER BY id ASC',
    [room.id]
  )

  // Get current game if playing
  let game = null
  let clues: any[] = []
  let currentTurnPlayerId: number | null = null
  if (room.status === 'playing') {
    game = await queryOne(
      'SELECT id, room_id, round_num, phase, clues_submitted, votes_submitted FROM games WHERE room_id = ? ORDER BY id DESC LIMIT 1',
      [room.id]
    )

    if (game) {
      clues = await query(
        `SELECT c.id, c.player_id, c.round_num, c.clue_text, p.name as player_name
         FROM clues c
         JOIN players p ON c.player_id = p.id
         WHERE c.game_id = ? AND c.round_num = ?
         ORDER BY c.created_at ASC`,
        [game.id, game.round_num]
      )

      if (game.phase === 'clue') {
        currentTurnPlayerId = await getCurrentTurnPlayerId(room.id, game.id, game.round_num)
      }
    }
  }

  return {
    room,
    players,
    game,
    clues,
    currentTurnPlayerId
  }
})
