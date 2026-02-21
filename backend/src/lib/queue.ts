import { Queue } from 'bullmq'

export const inferenceQueue = new Queue('inference', {
  connection: {
    host: new URL(process.env.REDIS_URL!).hostname,
    port: Number(new URL(process.env.REDIS_URL!).port) || 6379,
  },
})
