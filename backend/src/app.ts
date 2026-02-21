// src/app.ts — builds the app, doesn't start it
import Fastify from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import modelRoutes from './routes/models'
import dbPlugin from './plugins/db'
import corsPlugin from './plugins/cors'
import conversationRoutes from './routes/conversations'
import redisPlugin from './plugins/redis'

export async function buildApp() {
  const app = Fastify({ logger: true })

  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)

  await app.register(corsPlugin)
  await app.register(dbPlugin)
  await app.register(redisPlugin)
  await app.register(modelRoutes, { prefix: '/api/models' })
  await app.register(conversationRoutes, { prefix: '/api/conversations' })


  app.get('/health', async () => ({ status: 'ok' }))

  return app
}