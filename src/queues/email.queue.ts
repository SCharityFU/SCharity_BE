import { Queue } from 'bullmq';
import { redisClient } from '../config/redis';

export const emailQueue = new Queue('email', {
  connection: redisClient as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});
