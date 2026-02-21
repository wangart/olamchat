// src/app.ts — builds the app, doesn't start it
import Fastify, { FastifyInstance } from 'fastify'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import dbPlugin from './plugins/db'
import corsPlugin from './plugins/cors'
import redisPlugin from './plugins/redis'
import conversationRoutes from './routes/conversations'
import modelRoutes from './routes/models'
import streamRoutes from './routes/stream'
import jwtPlugin from './plugins/jwt'
import authPlugin from './plugins/auth'
import authRoutes from './routes/auth'

export async function buildApp() {
  const app = Fastify({ logger: true })

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  await app.register(corsPlugin)
  await app.register(dbPlugin)
  await app.register(redisPlugin)
  await app.register(jwtPlugin)
  await app.register(authPlugin)

  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(modelRoutes, { prefix: '/api/models' })

  await app.register(
    async (protectedRoutes: FastifyInstance) => {
      protectedRoutes.addHook('onRequest', app.authenticate)

      await protectedRoutes.register(conversationRoutes, { prefix: '/api/conversations' })
      await protectedRoutes.register(streamRoutes, { prefix: '/api/conversations' })
    },
    { prefix: '' },
  )

  app.get('/health', async () => ({ status: 'ok' }))

  return app
}
