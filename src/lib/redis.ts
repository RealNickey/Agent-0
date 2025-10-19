/**
 * Upstash Redis Client for Agent-0 Session Persistence
 * 
 * Provides connection management, health checks, and retry logic
 * for Redis operations. Designed for serverless environments.
 */

import { Redis } from '@upstash/redis';

// Singleton Redis client instance
let redisClient: Redis | null = null;

/**
 * Get or create Redis client instance
 * Uses environment variables: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN
 */
export function getRedisClient(): Redis {
  if (redisClient) {
    return redisClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    throw new Error(
      'Redis configuration missing. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in environment variables.'
    );
  }

  redisClient = new Redis({
    url,
    token,
    automaticDeserialization: true,
    retry: {
      retries: 3,
      backoff: (retryCount) => Math.min(1000 * 2 ** retryCount, 10000),
    },
  });

  return redisClient;
}

/**
 * Test Redis connection health
 * @returns true if connection is healthy, false otherwise
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const client = getRedisClient();
    const result = await client.ping();
    return result === 'PONG';
  } catch (error) {
    console.error('Redis connection test failed:', error);
    return false;
  }
}

/**
 * Execute Redis operation with retry logic and error handling
 * @param operation Function to execute
 * @param fallback Optional fallback value on failure
 */
export async function withRedisRetry<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    console.error('Redis operation failed:', error);
    if (fallback !== undefined) {
      return fallback;
    }
    return null;
  }
}

/**
 * Close Redis connection (useful for cleanup in tests)
 */
export function closeRedisConnection(): void {
  redisClient = null;
}

/**
 * Check if Redis is configured in environment
 */
export function isRedisConfigured(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL && 
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}
