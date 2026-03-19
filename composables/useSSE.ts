export type SSEEventHandler = (data: any) => void

export interface SSEState {
  connected: boolean
  error: string | null
}

export const useSSE = (roomId: Ref<string> | string) => {
  const state = reactive<SSEState>({
    connected: false,
    error: null
  })

  const handlers = new Map<string, SSEEventHandler[]>()
  let eventSource: EventSource | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let reconnectAttempts = 0
  const MAX_RECONNECT_ATTEMPTS = 10

  const getRoomId = () => typeof roomId === 'string' ? roomId : roomId.value

  const on = (eventType: string, handler: SSEEventHandler) => {
    if (!handlers.has(eventType)) {
      handlers.set(eventType, [])
    }
    handlers.get(eventType)!.push(handler)
  }

  const off = (eventType: string, handler: SSEEventHandler) => {
    const list = handlers.get(eventType)
    if (list) {
      const idx = list.indexOf(handler)
      if (idx !== -1) list.splice(idx, 1)
    }
  }

  const emit = (eventType: string, data: any) => {
    const list = handlers.get(eventType) || []
    for (const h of list) {
      try {
        h(data)
      } catch (err) {
        console.error(`[SSE] Handler error for ${eventType}:`, err)
      }
    }
  }

  const connect = () => {
    if (process.server) return
    if (eventSource) {
      eventSource.close()
    }

    const id = getRoomId()
    if (!id) return

    const url = `/api/events/${id}`
    console.log(`[SSE] Connecting to ${url}`)

    try {
      eventSource = new EventSource(url)

      eventSource.onopen = () => {
        state.connected = true
        state.error = null
        reconnectAttempts = 0
        console.log(`[SSE] Connected to room ${id}`)
      }

      eventSource.onerror = (err) => {
        state.connected = false
        state.error = 'Connection lost'
        console.error('[SSE] Connection error:', err)

        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
          reconnectAttempts++
          console.log(`[SSE] Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`)
          reconnectTimer = setTimeout(connect, delay)
        }
      }

      // Listen for all known events
      const eventTypes = [
        'connected',
        'room_created',
        'player_joined',
        'game_started',
        'clue_submitted',
        'phase_changed',
        'vote_submitted',
        'vote_result',
        'game_over',
        'next_round',
        'mr_white_failed',
        'mr_white_guess'
      ]

      for (const type of eventTypes) {
        eventSource.addEventListener(type, (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data)
            emit(type, data)
          } catch (err) {
            console.error(`[SSE] Parse error for event ${type}:`, err)
          }
        })
      }

      // Generic message handler
      eventSource.onmessage = (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data)
          emit('message', data)
        } catch (err) {
          // Ignore
        }
      }
    } catch (err) {
      state.error = 'Failed to connect'
      console.error('[SSE] Failed to create EventSource:', err)
    }
  }

  const disconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
    state.connected = false
    reconnectAttempts = MAX_RECONNECT_ATTEMPTS // Prevent reconnect
  }

  onMounted(() => {
    connect()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    state: readonly(state),
    on,
    off,
    connect,
    disconnect
  }
}
