import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { models } from './models'

const connection = postgres(process.env.DATABASE_URL!)
const db = drizzle(connection)

async function seed() {
  console.log('Seeding database...')

  await db
    .insert(models)
    .values({
      modelName: 'stepfun/step-3.5-flash:free',
      modelDescription: 'StepFun Step 3.5 Flash (free via OpenRouter)',
    })
    .onConflictDoNothing({ target: models.modelName })

  console.log('Seeding complete.')
  await connection.end()
}

seed()
