import { queryOne, execute, query } from '~/server/utils/db'
import { broadcastToRoom, } from '~/server/utils/sse'
import { checkWinCondition } from '~/server/utils/game'
import type { Game, Player } from '~/server/utils/game'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.gameId || !body?.playerId || !body?.sessionId || !body?.guess) {
    throw createError({ statusCode: 400, message: 'gameId, playerId, sessionId, guess are required' })
  }

  const gameId = parseInt(body.gameId)
  const playerId = parseInt(body.playerId)
  const sessionId = String(body.sessionId)
  const guess = String(body.guess).trim()

  // Get game
  const game = await queryOne<Game>('SELECT * FROM games WHERE id = ?', [gameId])
  if (!game) {
    throw createError({ statusCode: 404, message: 'Game tidak ditemukan' })
  }

  // Verify player is Mr. White and was eliminated
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

  if (player.role !== 'mrwhite') {
    throw createError({ statusCode: 400, message: 'Hanya Mr. White yang bisa melakukan ini' })
  }

  if (!player.is_eliminated) {
    throw createError({ statusCode: 400, message: 'Mr. White belum tersingkir' })
  }

  // Check if guess is correct (case-insensitive)
  const isCorrect = guess.toLowerCase() === game.civilian_word.toLowerCase()

  const updatedPlayers = await query<Player>(
    'SELECT id, name, role, word, is_eliminated FROM players WHERE room_id = ?',
    [game.room_id]
  )

  if (isCorrect) {
    // Mr. White wins!
    await execute('UPDATE games SET phase = ? WHERE id = ?', ['finished', gameId])
    await execute('UPDATE rooms SET status = ? WHERE id = ?', ['finished', game.room_id])

    broadcastToRoom(game.room_id, 'game_over', {
      winner: 'mrwhite',
      reason: `Mr. White berhasil menebak kata Civilian dengan benar! Jawabannya: "${game.civilian_word}"`,
      players: updatedPlayers,
      civilianWord: game.civilian_word,
      undercoverWord: game.undercover_word,
      mrWhiteGuess: guess,
      mrWhiteCorrect: true
    })
  } else {
    // Mr. White failed, check if game continues
    await execute('UPDATE games SET phase = ? WHERE id = ?', ['clue', gameId])

    // Check win condition (Mr. White already eliminated)
    const winResult = await checkWinCondition(gameId, game.room_id)

    if (winResult) {
      await execute('UPDATE games SET phase = ? WHERE id = ?', ['finished', gameId])
      await execute('UPDATE rooms SET status = ? WHERE id = ?', ['finished', game.room_id])

      broadcastToRoom(game.room_id, 'game_over', {
        winner: winResult.winner,
        reason: winResult.reason,
        players: updatedPlayers,
        civilianWord: game.civilian_word,
        undercoverWord: game.undercover_word,
        mrWhiteGuess: guess,
        mrWhiteCorrect: false
      })
    } else {
      // Advance to next round
      const nextRound = game.round_num + 1
      await execute(
        'UPDATE games SET round_num = ?, phase = ?, clues_submitted = 0, votes_submitted = 0 WHERE id = ?',
        [nextRound, 'clue', gameId]
      )

      const activePlayersForNext = await query<Player>(
        'SELECT id, name, is_eliminated FROM players WHERE room_id = ? AND is_eliminated = 0',
        [game.room_id]
      )

      broadcastToRoom(game.room_id, 'mr_white_failed', {
        mrWhiteGuess: guess,
        civilianWord: game.civilian_word,
        nextRound,
        activePlayers: activePlayersForNext
      })

      broadcastToRoom(game.room_id, 'next_round', {
        round: nextRound,
        phase: 'clue',
        activePlayers: activePlayersForNext
      })
    }
  }

  return {
    correct: isCorrect,
    civilianWord: game.civilian_word
  }
})
