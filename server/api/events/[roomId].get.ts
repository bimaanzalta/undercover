import { registerSSEClient, unregisterSSEClient } from '~/server/utils/sse'

export default defineEventHandler(async (event) => {
  const roomId = getRouterParam(event, 'roomId')

  if (!roomId) {
    throw createError({ statusCode: 400, message: 'roomId is required' })
  }

  // Set SSE headers
  setResponseHeader(event, 'Content-Type', 'text/event-stream')
  setResponseHeader(event, 'Cache-Control', 'no-cache, no-transform')
  setResponseHeader(event, 'Connection', 'keep-alive')
  setResponseHeader(event, 'X-Accel-Buffering', 'no')
  setResponseHeader(event, 'Access-Control-Allow-Origin', '*')

  // Get the raw Node.js response
  const res = event.node.res

  // Flush headers immediately so browser starts receiving events right away
  res.flushHeaders()

  // Send initial connection event
  res.write(`event: connected\ndata: ${JSON.stringify({ roomId, time: Date.now() })}\n\n`)

  const client = { event, res }

  registerSSEClient(roomId.toUpperCase(), client)

  // Keep-alive ping every 15 seconds
  const pingInterval = setInterval(() => {
    try {
      res.write(`: ping\n\n`)
    } catch (err) {
      clearInterval(pingInterval)
      unregisterSSEClient(roomId.toUpperCase(), client)
    }
  }, 15000)

  // Handle client disconnect
  event.node.req.on('close', () => {
    clearInterval(pingInterval)
    unregisterSSEClient(roomId.toUpperCase(), client)
  })

  event.node.req.on('error', () => {
    clearInterval(pingInterval)
    unregisterSSEClient(roomId.toUpperCase(), client)
  })

  // Keep the connection open
  return new Promise<void>((resolve) => {
    event.node.req.on('close', () => {
      resolve()
    })
  })
})
