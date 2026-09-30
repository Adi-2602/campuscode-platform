const Redis = require('ioredis');
const logger = require('./logger.config');

let redisClient = null;

/**
 * Create and configure Redis client
 */
const createRedisClient = () => {
  if (redisClient) {
    return redisClient;
  }

  const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB) || 0,

    // Connection settings
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT) || 10000,
    keepAlive: parseInt(process.env.REDIS_KEEP_ALIVE) || 30000,
    
    // Enable offline queue (queues commands when disconnected)
    enableOfflineQueue: true,
    
    // Max retries per command
    maxRetriesPerRequest: 3,
    
    // Retry strategy for reconnection. Keeps retrying by default so the app
    // recovers on its own after a Redis outage; set REDIS_MAX_RETRIES to give up.
    retryStrategy(times) {
      const maxRetries = parseInt(process.env.REDIS_MAX_RETRIES) || 0;

      if (maxRetries > 0 && times > maxRetries) {
        logger.error(`Redis max retries (${maxRetries}) exceeded`);
        return null; // Stop retrying
      }

      // Backoff: 50ms, 100ms, 150ms, ... capped at 3000ms
      const delay = Math.min(times * 50, 3000);
      // Log the first few attempts, then only every 20th, to keep logs readable
      if (times <= 3 || times % 20 === 0) {
        logger.warn(`Redis retry attempt ${times}, reconnecting in ${delay}ms`);
      }
      return delay;
    },
    
    // Reconnect on error
    reconnectOnError(err) {
      const targetError = 'READONLY';
      if (err.message.includes(targetError)) {
        // Reconnect if Redis is in read-only mode
        return true;
      }
      return false;
    }
  };

  // REDIS_URL (e.g. Upstash "rediss://default:<password>@<host>:6379") wins over host/port.
  // The "rediss://" scheme turns on TLS automatically.
  let redisUrl = process.env.REDIS_URL;
  // Upstash only accepts TLS; a "redis://" URL gets its connection dropped
  // straight away (EPIPE / connection closed), so upgrade it to "rediss://".
  if (redisUrl && redisUrl.startsWith('redis://') && redisUrl.includes('.upstash.io')) {
    logger.warn('REDIS_URL points to Upstash but uses redis:// - switching to rediss:// (TLS)');
    redisUrl = 'rediss://' + redisUrl.slice('redis://'.length);
  }

  redisClient = redisUrl
    ? new Redis(redisUrl, redisConfig)
    : new Redis(redisConfig);

  // Event handlers
  redisClient.on('connect', () => {
    logger.info('Redis client connecting...');
  });

  redisClient.on('ready', () => {
    logger.info('✅ Redis client ready');
  });

  redisClient.on('error', (err) => {
    logger.error(`❌ Redis client error: ${err.message}`);
  });

  redisClient.on('close', () => {
    logger.warn('⚠️ Redis connection closed');
  });

  redisClient.on('reconnecting', (delay) => {
    logger.info(`🔄 Redis reconnecting in ${delay}ms...`);
  });

  redisClient.on('end', () => {
    logger.error('💀 Redis connection ended permanently');
  });

  return redisClient;
};

/**
 * Get Redis client instance
 */
const getRedisClient = () => {
  if (!redisClient) {
    return createRedisClient();
  }
  return redisClient;
};

/**
 * Close Redis connection gracefully
 */
const closeRedisConnection = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis connection closed gracefully');
  }
};

/**
 * Health check
 */
const checkRedisHealth = async () => {
  try {
    const client = getRedisClient();
    const result = await client.ping();
    return result === 'PONG';
  } catch (error) {
    logger.error('Redis health check failed:', error.message);
    return false;
  }
};

module.exports = {
  createRedisClient,
  getRedisClient,
  closeRedisConnection,
  checkRedisHealth
};