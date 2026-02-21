import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { eq, and } from 'drizzle-orm'
import { db } from '../db'
import { conversations } from '../db/schema'

const streamRoutes: FastifyPluginAsync = async (app) => {
  app.get<{
    Params: { id: string }
  }>(
    '/:id/stream',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
      },
    },
    async (request, reply) => {
      const { id } = request.params
      const userId = request.user.sub

      // Ownership check
      const [conv] = await db
        .select({ id: conversations.id })
        .from(conversations)
        .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
        .limit(1)

      if (!conv) {
        return reply.code(404).send({ error: 'Conversation not found' })
      }

      // Set SSE headers — use the request's Origin so it works
      // from both localhost and 127.0.0.1
      const origin = request.headers.origin ?? 'http://localhost:3000'
      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
      })

      // Create a DUPLICATE Redis connection for subscribing
      // (a subscribed Redis client can't do other commands)
      const sub = app.redis.duplicate()

      const channel = `stream:${id}`
      await sub.subscribe(channel)

      sub.on('message', (_ch: string, message: string) => {
        reply.raw.write(`data: ${message}\n\n`)
      })

      // Clean up when the client disconnects
      request.raw.on('close', () => {
        sub.unsubscribe(channel)
        sub.disconnect()
      })
    },
  )
}

export default streamRoutes
