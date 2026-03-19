import { queryOne, execute, query } from '~/server/utils/db'
import { broadcastToRoom } from '~/server/utils/sse'
import { calculateVotes, checkWinCondition } from '~/server/utils/game'
import type { Game, Player, Vote } from '~/server/utils/game'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body?.gameId || !body?.playerId || !body?.sessionId || !body?.targetId) {
    throw createError({ statusCode: 400, message: 'gameId, playerId, sessionId, targetId are required' })
  }

  const gameId = parseInt(body.gameId)
  const playerId = parseInt(body.playerId)
  const sessionId = String(body.sessionId)
  const targetId = parseInt(body.targetId)

  // Get game
  const game = await queryOne<Game>('SELECT * FROM games WHERE id = ?', [gameId])
  if (!game) {
    throw createError({ statusCode: 404, message: 'Game tidak ditemukan' })
  }

  if (game.phase !== 'voting') {
    throw createError({ statusCode: 400, message: 'Bukan fase voting' })
  }

  // Verify voter
  const voter = await queryOne<Player>(
    'SELECT * FROM players WHERE id = ? AND room_id = ?',
    [playerId, game.room_id]
  )

  if (!voter) {
    throw createError({ statusCode: 404, message: 'Pemain tidak ditemukan' })
  }

  if (voter.session_id !== sessionId) {
    throw createError({ statusCode: 403, message: 'Session tidak valid' })
  }

  if (voter.is_eliminated) {
    throw createError({ statusCode: 400, message: 'Pemain yang tersingkir tidak bisa voting' })
  }

  // Check if already voted
  const existingVote = await queryOne<Vote>(
    'SELECT * FROM votes WHERE game_id = ? AND voter_id = ? AND round_num = ?',
    [gameId, playerId, game.round_num]
  )

  if (existingVote) {
    throw createError({ statusCode: 400, message: 'Kamu sudah voting di ronde ini' })
  }

  // Verify target is an active player
  const target = await queryOne<Player>(
    'SELECT * FROM players WHERE id = ? AND room_id = ? AND is_eliminated = 0',
    [targetId, game.room_id]
  )

  if (!target) {
    throw createError({ statusCode: 404, message: 'Target tidak valid atau sudah tersingkir' })
  }

  if (targetId === playerId) {
    throw createError({ statusCode: 400, message: 'Tidak bisa voting diri sendiri' })
  }

  // Save vote
  await execute(
    'INSERT INTO votes (game_id, round_num, voter_id, target_id) VALUES (?, ?, ?, ?)',
    [gameId, game.round_num, playerId, targetId]
  )

  // Get active player count
  const activePlayers = await query<Player>(
    'SELECT * FROM players WHERE room_id = ? AND is_eliminated = 0',
    [game.room_id]
  )

  // Count current votes
  const currentVotes = await query<Vote>(
    'SELECT * FROM votes WHERE game_id = ? AND round_num = ?',
    [gameId, game.round_num]
  )

  const votesSubmitted = currentVotes.length

  // Update votes_submitted
  await execute(
    'UPDATE games SET votes_submitted = ? WHERE id = ?',
    [votesSubmitted, gameId]
  )

  // Broadcast vote progress
  broadcastToRoom(game.room_id, 'vote_submitted', {
    votesSubmitted,
    totalNeeded: activePlayers.length
  })

  // If all active players voted → calculate result
  if (votesSubmitted >= activePlayers.length) {
    const eliminatedId = await calculateVotes(gameId, game.round_num)

    let eliminatedPlayer: Player | null = null
    let mrWhiteGuessing = false

    if (eliminatedId) {
      eliminatedPlayer = await queryOne<Player>('SELECT * FROM players WHERE id = ?', [eliminatedId])

      // Mark as eliminated
      await execute('UPDATE players SET is_eliminated = 1 WHERE id = ?', [eliminatedId])

      // If Mr. White is eliminated, they get to guess
      if (eliminatedPlayer?.role === 'mrwhite') {
        mrWhiteGuessing = true
      }
    }

    // Get updated active players
    const updatedPlayers = await query<Player>(
      'SELECT id, name, role, word, is_eliminated FROM players WHERE room_id = ?',
      [game.room_id]
    )

    // Vote tally
    const voteTally: Record<number, number> = {}
    for (const vote of currentVotes) {
      voteTally[vote.target_id] = (voteTally[vote.target_id] || 0) + 1
    }

    // Get vote details with names
    const voteDetails = await query(
      `SELECT v.target_id, p.name as target_name, COUNT(*) as vote_count
       FROM votes v
       JOIN players p ON v.target_id = p.id
       WHERE v.game_id = ? AND v.round_num = ?
       GROUP BY v.target_id, p.name
       ORDER BY vote_count DESC`,
      [gameId, game.round_num]
    )

    if (mrWhiteGuessing) {
      // Set phase to 'result' and wait for Mr. White's guess
      await execute('UPDATE games SET phase = ? WHERE id = ?', ['result', gameId])

      broadcastToRoom(game.room_id, 'vote_result', {
        eliminatedPlayer: eliminatedPlayer ? {
          id: eliminatedPlayer.id,
          name: eliminatedPlayer.name,
          role: eliminatedPlayer.role
        } : null,
        tied: !eliminatedId,
        mrWhiteGuessing: true,
        voteDetails,
        players: updatedPlayers.map(p => ({
          id: p.id,
          name: p.name,
          is_eliminated: p.is_eliminated,
          role: p.role
        }))
      })

      return { success: true, mrWhiteGuessing: true }
    }

    // Check win condition
    const winResult = eliminatedId
      ? await checkWinCondition(gameId, game.room_id)
      : null

    if (winResult) {
      // Game over
      await execute('UPDATE games SET phase = ? WHERE id = ?', ['finished', gameId])
      await execute('UPDATE rooms SET status = ? WHERE id = ?', ['finished', game.room_id])

      // Get final player data with roles revealed
      broadcastToRoom(game.room_id, 'game_over', {
        winner: winResult.winner,
        reason: winResult.reason,
        eliminatedPlayer: eliminatedPlayer ? {
          id: eliminatedPlayer.id,
          name: eliminatedPlayer.name,
          role: eliminatedPlayer.role
        } : null,
        tied: !eliminatedId,
        voteDetails,
        players: updatedPlayers,
        civilianWord: game.civilian_word,
        undercoverWord: game.undercover_word
      })
    } else {
      // Continue to next round or show result
      await execute('UPDATE games SET phase = ? WHERE id = ?', ['result', gameId])

      broadcastToRoom(game.room_id, 'vote_result', {
        eliminatedPlayer: eliminatedPlayer ? {
          id: eliminatedPlayer.id,
          name: eliminatedPlayer.name,
          role: eliminatedPlayer.role
        } : null,
        tied: !eliminatedId,
        voteDetails,
        players: updatedPlayers.map(p => ({
          id: p.id,
          name: p.name,
          is_eliminated: p.is_eliminated,
          role: p.role
        }))
      })
    }
  }

  return { success: true, votesSubmitted, totalNeeded: activePlayers.length }
})
