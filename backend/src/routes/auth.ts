import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { signup, login } from '../services/auth.service'

const authRoutes: FastifyPluginAsync = async (app) => {
  const bodySchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  })

  app.post<{
    Body: { email: string; password: string }
  }>(
    '/signup',
    {
      schema: { body: bodySchema },
      config: {
        rateLimit: {
          max: 5,
          timeWindow: '1 minute',
        },
      },
    },
    async (request, reply) => {
      try {
        const user = await signup(request.body.email, request.body.password)
        const token = app.jwt.sign({ sub: user.id })
        reply.code(201)
        return { token, user }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Signup failed'
        reply.code(409).send({ error: message })
      }
    },
  )

  app.post<{
    Body: { email: string; password: string }
  }>(
    '/login',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
      schema: { body: bodySchema },
    },
    async (request, reply) => {
      try {
        const user = await login(request.body.email, request.body.password)
        const token = app.jwt.sign({ sub: user.id })
        return { token, user }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Login failed'
        reply.code(401).send({ error: message })
      }
    },
  )
}

export default authRoutes
