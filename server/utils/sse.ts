import type { H3Event } from 'h3'

interface SSEClient {
  event: H3Event
  res: any
}

// Map of roomId -> Set of SSE client responses
const sseClients = new Map<string, Set<SSEClient>>()

/**
 * Register a new SSE client for a room
 */
export function registerSSEClient(roomId: string, client: SSEClient): void {
  if (!sseClients.has(roomId)) {
    sseClients.set(roomId, new Set())
  }
  sseClients.get(roomId)!.add(client)
  console.log(`[SSE] Client registered for room ${roomId}. Total: ${sseClients.get(roomId)!.size}`)
}

/**
 * Unregister an SSE client from a room
 */
export function unregisterSSEClient(roomId: string, client: SSEClient): void {
  const clients = sseClients.get(roomId)
  if (clients) {
    clients.delete(client)
    if (clients.size === 0) {
      sseClients.delete(roomId)
    }
    console.log(`[SSE] Client unregistered from room ${roomId}. Remaining: ${clients.size}`)
  }
}

/**
 * Broadcast an SSE event to all clients in a room
 */
export function broadcastToRoom(roomId: string, eventType: string, data: any): void {
  const clients = sseClients.get(roomId)
  if (!clients || clients.size === 0) {
    console.log(`[SSE] No clients for room ${roomId}`)
    return
  }

  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`
  const deadClients: SSEClient[] = []

  for (const client of clients) {
    try {
      client.res.write(payload)
    } catch (err) {
      console.error(`[SSE] Error writing to client in room ${roomId}:`, err)
      deadClients.push(client)
    }
  }

  // Clean up dead clients
  for (const dead of deadClients) {
    clients.delete(dead)
  }

  console.log(`[SSE] Broadcasted "${eventType}" to ${clients.size} clients in room ${roomId}`)
}

/**
 * Send a keep-alive ping to all clients
 */
export function sendPing(roomId: string): void {
  const clients = sseClients.get(roomId)
  if (!clients || clients.size === 0) return

  const payload = `: ping\n\n`
  const deadClients: SSEClient[] = []

  for (const client of clients) {
    try {
      client.res.write(payload)
    } catch (err) {
      deadClients.push(client)
    }
  }

  for (const dead of deadClients) {
    clients.delete(dead)
  }
}

/**
 * Get client count for a room
 */
export function getClientCount(roomId: string): number {
  return sseClients.get(roomId)?.size || 0
}
