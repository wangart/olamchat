import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { models } from './models'

const connection = postgres(process.env.DATABASE_URL!)
const db = drizzle(connection)

async function seed() {
  console.log('Seeding database...')

  await db.insert(models).values({
    modelName: 'qwen3:8b',
    modelDescription: 'Qwen 3 8B parameter model',
  }).onConflictDoNothing({ target: models.modelName })

  console.log('Seeding complete.')
  await connection.end()
}

seed()
