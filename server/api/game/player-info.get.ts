import { queryOne } from '~/server/utils/db'
import type { Player } from '~/server/utils/game'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const playerId = query.playerId
  const sessionId = query.sessionId

  if (!playerId || !sessionId) {
    throw createError({ statusCode: 400, message: 'playerId and sessionId are required' })
  }

  const player = await queryOne<Player>(
    'SELECT * FROM players WHERE id = ?',
    [parseInt(String(playerId))]
  )

  if (!player) {
    throw createError({ statusCode: 404, message: 'Pemain tidak ditemukan' })
  }

  if (player.session_id !== String(sessionId)) {
    throw createError({ statusCode: 403, message: 'Session tidak valid' })
  }

  return {
    id: player.id,
    name: player.name,
    role: player.role,
    word: player.word,
    is_eliminated: player.is_eliminated,
    room_id: player.room_id
  }
})
