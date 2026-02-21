import 'dotenv/config'
import { buildApp } from './app'

const start = async () => {
  const app = await buildApp()
  try {
    await app.listen({ port: Number(process.env.PORT) || 3001 })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()