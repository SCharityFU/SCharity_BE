import Redis, { RedisOptions } from 'ioredis';

const redisConfig: RedisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  username: process.env.REDIS_USERNAME || undefined,
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  ...(process.env.REDIS_TLS === 'true' && {
    tls: { rejectUnauthorized: false },
  }),
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

const globalForRedis = global as unknown as { redisClient: Redis };

export const redisClient = globalForRedis.redisClient || new Redis(redisConfig);

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redisClient = redisClient;
}

redisClient.on('connect', () => {
  // eslint-disable-next-line no-console
  console.log('Redis connected');
});

redisClient.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('Redis error:', err);
});

export default redisClient;
