import { queryOne, execute, query } from '~/server/utils/db'
import { broadcastToRoom } from '~/server/utils/sse'
import { getCurrentTurnPlayerId } from '~/server/utils/game'
import type { Game, Player, Clue } from '~/server/utils/game'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.gameId || !body?.playerId || !body?.sessionId) {
    throw createError({ statusCode: 400, message: 'gameId, playerId, and sessionId are required' })
  }

  const gameId = parseInt(body.gameId)
  const playerId = parseInt(body.playerId)
  const sessionId = String(body.sessionId)
  const rawClue = String(body.clue ?? '').trim().slice(0, 200)
  // Allow empty clue = auto-pass (time ran out)
  const clueText = rawClue || '(lewati)'

  // Validate single word clue (skip validation for auto-pass)
  if (rawClue && rawClue.includes(' ') && rawClue.split(' ').length > 2) {
    throw createError({ statusCode: 400, message: 'Clue hanya boleh 1-2 kata' })
  }

  // Get game
  const game = await queryOne<Game>('SELECT * FROM games WHERE id = ?', [gameId])
  if (!game) {
    throw createError({ statusCode: 404, message: 'Game tidak ditemukan' })
  }

  if (game.phase !== 'clue') {
    throw createError({ statusCode: 400, message: 'Bukan fase memberikan clue' })
  }

  // Verify player
  const player = await queryOne<Player>(
    'SELECT * FROM players WHERE id = ? AND room_id = ?',
    [playerId, game.room_id]
  )

  if (!player) {
    throw createError({ statusCode: 404, message: 'Pemain tidak ditemukan' })
  }

  if (player.session_id !== sessionId) {
    throw createError({ statusCode: 403, message: 'Session tidak valid' })
  }

  if (player.is_eliminated) {
    throw createError({ statusCode: 400, message: 'Pemain yang tersingkir tidak bisa memberikan clue' })
  }

  // Validate it's this player's turn
  const turnPlayerId = await getCurrentTurnPlayerId(game.room_id, gameId, game.round_num)
  if (turnPlayerId !== playerId) {
    throw createError({ statusCode: 400, message: 'Belum giliran kamu!' })
  }

  // Check if already submitted clue this round
  const existingClue = await queryOne<Clue>(
    'SELECT * FROM clues WHERE game_id = ? AND player_id = ? AND round_num = ?',
    [gameId, playerId, game.round_num]
  )

  if (existingClue) {
    throw createError({ statusCode: 400, message: 'Kamu sudah memberikan clue di ronde ini' })
  }

  // Save clue
  await execute(
    'INSERT INTO clues (game_id, player_id, round_num, clue_text) VALUES (?, ?, ?, ?)',
    [gameId, playerId, game.round_num, clueText]
  )

  // Get all clues for this round
  const allClues = await query<Clue>(
    `SELECT c.*, p.name as player_name
     FROM clues c
     JOIN players p ON c.player_id = p.id
     WHERE c.game_id = ? AND c.round_num = ?
     ORDER BY c.created_at ASC`,
    [gameId, game.round_num]
  )

  // Get active player count
  const activePlayers = await query<Player>(
    'SELECT * FROM players WHERE room_id = ? AND is_eliminated = 0',
    [game.room_id]
  )

  const cluesSubmitted = allClues.length

  // Update clues_submitted count
  await execute(
    'UPDATE games SET clues_submitted = ? WHERE id = ?',
    [cluesSubmitted, gameId]
  )

  // Compute next turn player (null = all submitted)
  const nextTurnPlayerId = await getCurrentTurnPlayerId(game.room_id, gameId, game.round_num)

  // Broadcast clue submitted + whose turn is next
  broadcastToRoom(game.room_id, 'clue_submitted', {
    clues: allClues,
    totalNeeded: activePlayers.length,
    cluesSubmitted,
    currentTurnPlayerId: nextTurnPlayerId
  })

  // If all active players submitted clues → advance to voting
  if (cluesSubmitted >= activePlayers.length) {
    await execute(
      'UPDATE games SET phase = ?, votes_submitted = 0 WHERE id = ?',
      ['voting', gameId]
    )

    broadcastToRoom(game.room_id, 'phase_changed', {
      phase: 'voting',
      round: game.round_num,
      clues: allClues,
      activePlayers: activePlayers.map(p => ({
        id: p.id,
        name: p.name,
        is_eliminated: p.is_eliminated
      }))
    })
  }

  return { success: true, cluesSubmitted, totalNeeded: activePlayers.length }
})
