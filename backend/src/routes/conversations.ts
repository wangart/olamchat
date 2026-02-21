import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { getUserConversations, createConversation, editConversation, deleteConversation, getConversationMessages } from '../services/conversations.service'
import { createMessage } from '../services/messages.service'

const conversationRoutes: FastifyPluginAsync = async (app) => {

  // ─── GET /api/conversations ──────────────────────────
  app.get('/', async (request) => {
    return getUserConversations()
  })

  // ─── POST /api/conversations ─────────────────────────
  app.post<{
    Body: { model: string }
  }>('/', {
    schema: {
      body: z.object({
        model: z.string().min(1),
      }),
    },
  }, async (request, reply) => {
    const conv = await createConversation(request.body.model)
    reply.code(201)
    return conv
  })

  // ─── PUT /api/conversations/:id ──────────────────────
  app.put<{
    Params: { id: string }
    Body: { title: string }
  }>('/:id', {
    schema: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        title: z.string().min(1),
      }),
    },
  }, async (request) => {
    return editConversation(request.params.id, request.body.title)
  })

  // ─── GET /api/conversations/:id/messages ─────────────
  app.get<{
    Params: { id: string }
  }>('/:id/messages', {
    schema: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
  }, async (request) => {
    return getConversationMessages(request.params.id)
  })

  // ─── POST /api/conversations/:id/messages ─────────────
  app.post<{
    Params: { id: string }
    Body: { content: string }
  }>('/:id/messages', {
    schema: {
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        content: z.string().min(1),
      }),
    },
  }, async (request, reply) => {
    const msg = await createMessage(request.params.id, request.body.content)
    reply.code(201)
    return msg
  })

  // ─── DELETE /api/conversations/:id ───────────────────
  app.delete<{
    Params: { id: string }
  }>('/:id', {
    schema: {
      params: z.object({
        id: z.string().uuid(),
      }),
    },
  }, async (request) => {
    return deleteConversation(request.params.id)
  })
}

export default conversationRoutes
