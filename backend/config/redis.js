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
    
    // Retry strategy for reconnection
    retryStrategy(times) {
      const maxRetries = parseInt(process.env.REDIS_MAX_RETRIES) || 10;
      
      if (times > maxRetries) {
        logger.error(`Redis max retries (${maxRetries}) exceeded`);
        return null; // Stop retrying
      }
      
      // Exponential backoff: 50ms, 100ms, 200ms, 400ms, ..., max 3000ms
      const delay = Math.min(times * 50, 3000);
      logger.warn(`Redis retry attempt ${times}, reconnecting in ${delay}ms`);
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
  redisClient = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, redisConfig)
    : new Redis(redisConfig);

  // Event handlers
  redisClient.on('connect', () => {
    logger.info('Redis client connecting...');
  });

  redisClient.on('ready', () => {
    logger.info('✅ Redis client ready');
  });

  redisClient.on('error', (err) => {
    logger.error('❌ Redis client error:', err.message);
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