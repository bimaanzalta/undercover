export interface GameSession {
  sessionId: string | null
  playerId: number | null
  roomId: string | null
  playerName: string | null
}

export const useGameSession = () => {
  const getSession = (): GameSession => {
    if (process.server) {
      return { sessionId: null, playerId: null, roomId: null, playerName: null }
    }

    return {
      sessionId: localStorage.getItem('sessionId'),
      playerId: localStorage.getItem('playerId') ? parseInt(localStorage.getItem('playerId')!) : null,
      roomId: localStorage.getItem('roomId'),
      playerName: localStorage.getItem('playerName')
    }
  }

  const saveSession = (data: Partial<GameSession> & { playerName?: string }) => {
    if (process.server) return

    if (data.sessionId !== undefined) {
      if (data.sessionId) localStorage.setItem('sessionId', data.sessionId)
      else localStorage.removeItem('sessionId')
    }
    if (data.playerId !== undefined) {
      if (data.playerId) localStorage.setItem('playerId', String(data.playerId))
      else localStorage.removeItem('playerId')
    }
    if (data.roomId !== undefined) {
      if (data.roomId) localStorage.setItem('roomId', data.roomId)
      else localStorage.removeItem('roomId')
    }
    if (data.playerName !== undefined) {
      if (data.playerName) localStorage.setItem('playerName', data.playerName)
      else localStorage.removeItem('playerName')
    }
  }

  const clearSession = () => {
    if (process.server) return
    localStorage.removeItem('sessionId')
    localStorage.removeItem('playerId')
    localStorage.removeItem('roomId')
    localStorage.removeItem('playerName')
  }

  const isValidSession = (): boolean => {
    const session = getSession()
    return !!(session.sessionId && session.playerId && session.roomId)
  }

  return {
    getSession,
    saveSession,
    clearSession,
    isValidSession
  }
}
