import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'

const jwtPlugin: FastifyPluginAsync = async (app) => {
  await app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  })
}

export default fp(jwtPlugin)

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: { sub: string }
  }
}
