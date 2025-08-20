import { createClient } from 'redis';

const redisClient = createClient();

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.on('connect', () => {
  console.log('✅ Redis client connected successfully.');
});

(async () => {
  await redisClient.connect();
})();

export default redisClient;
