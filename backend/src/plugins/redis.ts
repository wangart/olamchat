import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import Redis from 'ioredis'

const redisPlugin: FastifyPluginAsync = async (app) => {
  const connection = new Redis(process.env.REDIS_URL!)

  app.decorate('redis', connection)

  app.addHook('onClose', async () => {
    await connection.quit()
  })
}

export default fp(redisPlugin)

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis
  }
}