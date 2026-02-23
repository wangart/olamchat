import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import rateLimit from '@fastify/rate-limit'
import Redis from 'ioredis'

const rateLimitPlugin: FastifyPluginAsync = async (app) => {
  await app.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '1 minute',
    redis: new Redis(process.env.REDIS_URL!),
  })
}

export default fp(rateLimitPlugin)
