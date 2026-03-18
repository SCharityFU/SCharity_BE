import { Queue } from 'bullmq';
import { redisClient } from '../config/redis';

let _emailQueue: Queue;

export const emailQueue = new Proxy({} as Queue, {
  get(target, prop) {
    if (!_emailQueue) {
      _emailQueue = new Queue('email', {
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
    }
    const val = (_emailQueue as any)[prop];
    return typeof val === 'function' ? val.bind(_emailQueue) : val;
  },
});
