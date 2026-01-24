import KeyvRedis from '@keyv/redis';
import Keyv from 'keyv';
import { createClient } from 'redis';
import { CACHE_PROVIDER, REDIS_URL } from '../config/default';
import { logger } from '../utils/logger';
// const keyv = new Keyv('redis://user:pass@localhost:6379');
export const redisClient = createClient({ url: REDIS_URL });

let keyv: Keyv;

export async function cacheConnect() {
  if (CACHE_PROVIDER === 'REDIS') {
    if (!REDIS_URL) {
      logger.error(`Redis Database URL not set.`);
      return;
    }
    keyv = new Keyv(new KeyvRedis(REDIS_URL));
    logger.info(`Successfully connected to Redis Database via Keyv.`);
  } else {
    // Default to in-memory store
    keyv = new Keyv();
    logger.info(`Using in-memory cache store.`);
  }

  keyv.on('error', (err) => logger.error('Cache Client Error', err));
}

export async function cacheDisconnect() {
  if (keyv) {
    await keyv.disconnect();
    logger.info(`Successfully disconnected from cache.`);
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (!keyv) return null;
  const data = await keyv.get<T>(key);
  return data || null;
}

export async function cacheSet(key: string, value: unknown, ttlSec: number) {
  if (!keyv) return null;
  await keyv.set(key, value, ttlSec * 1000); // Keyv uses milliseconds
}

export async function cacheDel(key: string) {
  if (!keyv) return null;
  await keyv.delete(key);
}

export async function cacheClear() {
  if (!keyv) return null;
  await keyv.clear();
}
