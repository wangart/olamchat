// src/plugins/db.ts
import { FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '../db/schema'

const dbPlugin: FastifyPluginAsync = async (app) => {
  const connection = postgres(process.env.DATABASE_URL!)
  const db = drizzle(connection, { schema })

  app.decorate('db', db)

  app.addHook('onClose', async () => {
    await connection.end()
  })
}

export default fp(dbPlugin)

declare module 'fastify' {
  interface FastifyInstance {
    db: ReturnType<typeof drizzle>
  }
}