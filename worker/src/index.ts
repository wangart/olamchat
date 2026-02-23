import 'dotenv/config'
import { Worker } from 'bullmq'
import { processInferenceJob } from './processor'
import type { InferenceJobData } from './processor'

const redisUrl = new URL(process.env.REDIS_URL!)

const worker = new Worker<InferenceJobData>(
  'inference', // must match queue name in backend/src/lib/queue.ts
  processInferenceJob,
  {
    connection: {
      host: redisUrl.hostname,
      port: Number(redisUrl.port) || 6379,
    },
    concurrency: 1,
  },
)

worker.on('completed', (job) => {
  console.log(`[worker] Job ${job.id} completed`)
})

worker.on('failed', (job, err) => {
  console.error(`[worker] Job ${job?.id} failed:`, err.message)
})

worker.on('ready', () => {
  console.log('[worker] Ready — waiting for inference jobs...')
})

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[worker] Shutting down...')
  await worker.close()
  process.exit(0)
})
