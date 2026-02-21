import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { createMessage } from '../services/messages.service'

const messageRoutes: FastifyPluginAsync = async (app) => {

  // ─── POST /api/conversations ─────────────────────────
  app.post<{
    Body: { conversationId: string, content: string }
  }>('/', {
    schema: {
      body: z.object({
        conversationId: z.string().uuid(),
        content: z.string().min(1),
      }),
    },
  }, async (request, reply) => {
    const conv = await createMessage(request.body.conversationId, request.body.content)
    reply.code(201)
    return conv
  })
}

export default messageRoutes