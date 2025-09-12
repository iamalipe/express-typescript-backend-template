import { createClient } from 'redis';
import { REDIS_URL } from '../config/default';
import { logger } from '../utils/logger';

export const redisClient = createClient({ url: REDIS_URL });

redisClient.on('error', (err) => console.error('Redis Client Error', err));

export async function redisConnect() {
  if (!REDIS_URL) {
    logger.error(`Redis Database URL not set.`);
    return;
  }
  if (!redisClient.isOpen) {
    await redisClient.connect();
    logger.info(`Successfully connected to Redis Database.`);
  }
}

export async function redisDisconnect() {
  if (redisClient.isOpen) {
    await redisClient.quit();
    logger.info(`Successfully disconnected from Redis Database.`);
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!redisClient.isOpen) return null;
  const json = await redisClient.get(key);
  return json ? (JSON.parse(json) as T) : null;
}

export async function cacheSet(key: string, value: unknown, ttlSec: number) {
  if (!redisClient.isOpen) return null;
  await redisClient.set(key, JSON.stringify(value), { EX: ttlSec });
}

export async function cacheDel(patternOrKey: string) {
  if (!redisClient.isOpen) return null;
  // simple delete; for patterns, scan+del can be added if needed
  await redisClient.del(patternOrKey);
}
