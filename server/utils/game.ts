import { query, queryOne, execute } from './db'

export interface Player {
  id: number
  room_id: string
  name: string
  role: 'civilian' | 'undercover' | 'mrwhite' | null
  word: string | null
  is_eliminated: number
  session_id: string
}

export interface Game {
  id: number
  room_id: string
  round_num: number
  phase: 'clue' | 'voting' | 'result' | 'finished'
  civilian_word: string
  undercover_word: string
  clues_submitted: number
  votes_submitted: number
}

export interface Room {
  id: string
  host_name: string
  status: 'lobby' | 'playing' | 'finished'
  created_at: string
}

export interface WordPair {
  id: number
  civilian_word: string
  undercover_word: string
}

export interface Clue {
  id: number
  game_id: number
  player_id: number
  round_num: number
  clue_text: string
  player_name?: string
}

export interface Vote {
  id: number
  game_id: number
  round_num: number
  voter_id: number
  target_id: number
}

export type WinResult = {
  winner: 'civilian' | 'undercover' | 'mrwhite' | null
  reason: string
} | null

/**
 * Determine role distribution based on player count
 */
export function getRoleDistribution(playerCount: number): {
  undercover: number
  mrwhite: number
  civilian: number
} {
  let undercover = 1
  let mrwhite = 0

  if (playerCount >= 6 && playerCount <= 8) {
    undercover = playerCount >= 7 ? 2 : 1
    mrwhite = playerCount >= 8 ? 1 : 0
  } else if (playerCount >= 9) {
    undercover = 2
    mrwhite = 1
  }

  const civilian = playerCount - undercover - mrwhite
  return { undercover, mrwhite, civilian }
}

/**
 * Shuffle array in-place using Fisher-Yates
 */
export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Assign roles to players and pick a word pair
 */
export async function assignRolesAndWords(roomId: string, gameId: number): Promise<void> {
  const players = await query<Player>(
    'SELECT * FROM players WHERE room_id = ? AND is_eliminated = 0',
    [roomId]
  )

  if (players.length < 4) {
    throw new Error('Minimum 4 players required')
  }

  const { undercover, mrwhite } = getRoleDistribution(players.length)

  // Pick random word pair
  const wordPairs = await query<WordPair>('SELECT * FROM word_pairs ORDER BY RAND() LIMIT 1')
  const wordPair = wordPairs[0]

  if (!wordPair) {
    throw new Error('No word pairs available')
  }

  // Update game with words
  await execute(
    'UPDATE games SET civilian_word = ?, undercover_word = ? WHERE id = ?',
    [wordPair.civilian_word, wordPair.undercover_word, gameId]
  )

  // Assign roles
  const shuffled = shuffleArray(players)
  const roles: Array<{ role: 'civilian' | 'undercover' | 'mrwhite'; word: string | null }> = []

  for (let i = 0; i < shuffled.length; i++) {
    if (i < undercover) {
      roles.push({ role: 'undercover', word: wordPair.undercover_word })
    } else if (i < undercover + mrwhite) {
      roles.push({ role: 'mrwhite', word: null })
    } else {
      roles.push({ role: 'civilian', word: wordPair.civilian_word })
    }
  }

  // Save roles to players
  for (let i = 0; i < shuffled.length; i++) {
    await execute(
      'UPDATE players SET role = ?, word = ? WHERE id = ?',
      [roles[i].role, roles[i].word, shuffled[i].id]
    )
  }
}

/**
 * Check win condition for current game state
 */
export async function checkWinCondition(gameId: number, roomId: string): Promise<WinResult> {
  const players = await query<Player>(
    'SELECT * FROM players WHERE room_id = ?',
    [roomId]
  )

  const activePlayers = players.filter(p => p.is_eliminated === 0)
  const activeUndercoverPlayers = activePlayers.filter(p => p.role === 'undercover')
  const activeMrWhitePlayers = activePlayers.filter(p => p.role === 'mrwhite')
  const activeCivilianPlayers = activePlayers.filter(p => p.role === 'civilian')

  const totalUndercover = players.filter(p => p.role === 'undercover').length
  const totalMrWhite = players.filter(p => p.role === 'mrwhite').length

  // Check if all undercover + mrwhite eliminated → civilians win
  if (activeUndercoverPlayers.length === 0 && activeMrWhitePlayers.length === 0) {
    return {
      winner: 'civilian',
      reason: 'Semua Undercover dan Mr. White telah tersingkir!'
    }
  }

  // Check if undercover count >= civilian count → undercover wins
  if (activeUndercoverPlayers.length >= activeCivilianPlayers.length) {
    return {
      winner: 'undercover',
      reason: `Undercover mengimbangi jumlah Civilian! (${activeUndercoverPlayers.length} vs ${activeCivilianPlayers.length})`
    }
  }

  // Check if only 2 players left and one is mrwhite
  if (activePlayers.length === 2 && activeMrWhitePlayers.length === 1) {
    // Undercover all gone but mrwhite survived
    if (activeUndercoverPlayers.length === 0) {
      return null // Continue, Mr. White can still be voted out
    }
  }

  // If only 2 players left and undercover is one → undercover wins
  if (activePlayers.length <= 2 && activeUndercoverPlayers.length >= 1) {
    return {
      winner: 'undercover',
      reason: 'Undercover berhasil bertahan hingga akhir!'
    }
  }

  return null // Game continues
}

/**
 * Calculate votes and return the eliminated player id
 */
export async function calculateVotes(gameId: number, roundNum: number): Promise<number | null> {
  const votes = await query<Vote>(
    'SELECT * FROM votes WHERE game_id = ? AND round_num = ?',
    [gameId, roundNum]
  )

  if (votes.length === 0) return null

  // Count votes per target
  const voteCounts: Record<number, number> = {}
  for (const vote of votes) {
    voteCounts[vote.target_id] = (voteCounts[vote.target_id] || 0) + 1
  }

  // Find max votes
  let maxVotes = 0
  let eliminatedId: number | null = null
  let tied = false

  for (const [targetId, count] of Object.entries(voteCounts)) {
    if (count > maxVotes) {
      maxVotes = count
      eliminatedId = parseInt(targetId)
      tied = false
    } else if (count === maxVotes) {
      tied = true
    }
  }

  // If tied, no one eliminated
  if (tied) return null

  return eliminatedId
}

/**
 * Get the player ID whose turn it is to give a clue this round.
 * Turn order is rotated by (gameId + roundNum) so the starting player
 * varies each round/game, preventing the host from always going first.
 */
export async function getCurrentTurnPlayerId(
  roomId: string,
  gameId: number,
  roundNum: number
): Promise<number | null> {
  const activePlayers = await query<{ id: number }>(
    'SELECT id FROM players WHERE room_id = ? AND is_eliminated = 0 ORDER BY id ASC',
    [roomId]
  )
  if (activePlayers.length === 0) return null

  // Rotate starting position based on gameId + roundNum for variety
  const offset = (gameId + roundNum) % activePlayers.length
  const rotated = [
    ...activePlayers.slice(offset),
    ...activePlayers.slice(0, offset)
  ]

  const submitted = await query<{ player_id: number }>(
    'SELECT player_id FROM clues WHERE game_id = ? AND round_num = ?',
    [gameId, roundNum]
  )
  const submittedIds = new Set(submitted.map(c => c.player_id))
  return rotated.find(p => !submittedIds.has(p.id))?.id ?? null
}

/**
 * Get active player count for a room
 */
export async function getActivePlayerCount(roomId: string): Promise<number> {
  const result = await queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM players WHERE room_id = ? AND is_eliminated = 0',
    [roomId]
  )
  return result?.count || 0
}

/**
 * Get current game for a room
 */
export async function getCurrentGame(roomId: string): Promise<Game | null> {
  return queryOne<Game>(
    'SELECT * FROM games WHERE room_id = ? ORDER BY id DESC LIMIT 1',
    [roomId]
  )
}

/**
 * Get clues for current round
 */
export async function getCluesForRound(gameId: number, roundNum: number): Promise<Clue[]> {
  return query<Clue>(
    `SELECT c.*, p.name as player_name
     FROM clues c
     JOIN players p ON c.player_id = p.id
     WHERE c.game_id = ? AND c.round_num = ?
     ORDER BY c.created_at ASC`,
    [gameId, roundNum]
  )
}
