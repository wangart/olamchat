import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import {
  getUserConversations,
  createConversation,
  editConversation,
  deleteConversation,
  getConversationMessages,
  updateConversationSettings,
} from '../services/conversations.service'
import { createMessage } from '../services/messages.service'

const conversationRoutes: FastifyPluginAsync = async (app) => {
  // ─── GET /api/conversations ──────────────────────────
  app.get('/', async (request) => {
    return getUserConversations(request.user.sub)
  })

  // ─── POST /api/conversations ─────────────────────────
  app.post<{
    Body: { model: string }
  }>(
    '/',
    {
      schema: {
        body: z.object({
          model: z.string().min(1),
        }),
      },
    },
    async (request, reply) => {
      const conv = await createConversation(request.user.sub, request.body.model)
      reply.code(201)
      return conv
    },
  )

  // ─── PUT /api/conversations/:id ──────────────────────
  app.put<{
    Params: { id: string }
    Body: { title: string }
  }>(
    '/:id',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          title: z.string().min(1),
        }),
      },
    },
    async (request) => {
      return editConversation(request.user.sub, request.params.id, request.body.title)
    },
  )

  // ─── GET /api/conversations/:id/messages ─────────────
  app.get<{
    Params: { id: string }
  }>(
    '/:id/messages',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
      },
    },
    async (request) => {
      return getConversationMessages(request.user.sub, request.params.id)
    },
  )

  // ─── POST /api/conversations/:id/messages ─────────────
  app.post<{
    Params: { id: string }
    Body: { content: string }
  }>(
    '/:id/messages',
    {
      config: {
        rateLimit: {
          max: 20,
          timeWindow: '1 minute',
        },
      },
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          content: z.string().min(1),
        }),
      },
    },
    async (request, reply) => {
      const msg = await createMessage(request.user.sub, request.params.id, request.body.content)
      reply.code(201)
      return msg
    },
  )

  // ─── PATCH /api/conversations/:id/settings ───────────
  app.patch<{
    Params: { id: string }
    Body: { systemPrompt?: string | null; temperature?: number; maxTokens?: number }
  }>(
    '/:id/settings',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
        body: z.object({
          systemPrompt: z.string().nullable().optional(),
          temperature: z.number().min(0).max(2).optional(),
          maxTokens: z.number().int().min(1).max(16384).optional(),
        }),
      },
    },
    async (request) => {
      return updateConversationSettings(request.user.sub, request.params.id, request.body)
    },
  )

  // ─── DELETE /api/conversations/:id ───────────────────
  app.delete<{
    Params: { id: string }
  }>(
    '/:id',
    {
      schema: {
        params: z.object({
          id: z.string().uuid(),
        }),
      },
    },
    async (request) => {
      return deleteConversation(request.user.sub, request.params.id)
    },
  )
}

export default conversationRoutes
