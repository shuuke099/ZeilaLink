import { createHash } from 'crypto';

type CacheEntry = {
  value: string;
  expiresAt: number;
  bytes: number;
};

type RedisLike = {
  status: string;
  connect: () => Promise<void>;
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, mode: 'EX', ttlSeconds: number) => Promise<unknown>;
  scan: (cursor: string, matchMode: 'MATCH', pattern: string, countMode: 'COUNT', count: number) => Promise<[string, string[]]>;
  del: (...keys: string[]) => Promise<unknown>;
  on: (event: 'error', handler: (error: Error) => void) => void;
};

type RedisConstructor = new (url: string, options: Record<string, unknown>) => RedisLike;

const CACHE_PREFIX = 'zeilalink:api:v2';
const MAX_MEMORY_CACHE_ENTRIES = 250;
const MAX_MEMORY_CACHE_BYTES = 16 * 1024 * 1024;
const redisUrl = process.env.REDIS_URL?.trim();
const memoryCache = new Map<string, CacheEntry>();
let memoryCacheBytes = 0;

let redisClient: RedisLike | null = null;
let redisDisabledUntil = 0;

const normalizeForKey = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(normalizeForKey);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        const item = (value as Record<string, unknown>)[key];
        if (item !== undefined && item !== null && item !== '') {
          acc[key] = normalizeForKey(item);
        }
        return acc;
      }, {});
  }

  return value;
};

const namespacedKey = (key: string) => `${CACHE_PREFIX}:${key}`;

const deleteMemoryEntry = (key: string): void => {
  const entry = memoryCache.get(key);
  if (!entry) return;
  memoryCache.delete(key);
  memoryCacheBytes = Math.max(0, memoryCacheBytes - entry.bytes);
};

const putMemoryEntry = (key: string, value: string, expiresAt: number): void => {
  const bytes = Buffer.byteLength(key, 'utf8') + Buffer.byteLength(value, 'utf8');
  if (bytes > MAX_MEMORY_CACHE_BYTES) return;

  deleteMemoryEntry(key);
  memoryCache.set(key, { value, expiresAt, bytes });
  memoryCacheBytes += bytes;

  const now = Date.now();
  for (const [cachedKey, entry] of memoryCache) {
    if (entry.expiresAt <= now) deleteMemoryEntry(cachedKey);
  }

  while (
    memoryCache.size > MAX_MEMORY_CACHE_ENTRIES ||
    memoryCacheBytes > MAX_MEMORY_CACHE_BYTES
  ) {
    const oldestKey = memoryCache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    deleteMemoryEntry(oldestKey);
  }
};

const getRedis = async () => {
  if (!redisUrl || Date.now() < redisDisabledUntil) {
    return null;
  }

  if (!redisClient) {
    try {
      const dynamicImport = new Function('specifier', 'return import(specifier)') as (
        specifier: string,
      ) => Promise<{ default: RedisConstructor }>;
      const { default: Redis } = await dynamicImport('ioredis');

      redisClient = new Redis(redisUrl, {
        connectTimeout: 500,
        enableOfflineQueue: false,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
      });
    } catch {
      redisDisabledUntil = Date.now() + 30_000;
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[Cache] ioredis is not available; using memory cache');
      }
      return null;
    }

    redisClient.on('error', () => {
      redisDisabledUntil = Date.now() + 30_000;
      if (process.env.NODE_ENV !== 'test') {
        console.warn('[Cache] Redis unavailable; using memory cache');
      }
    });
  }

  try {
    if (redisClient.status === 'wait' || redisClient.status === 'end') {
      await redisClient.connect();
    }

    return redisClient.status === 'ready' ? redisClient : null;
  } catch {
    redisDisabledUntil = Date.now() + 30_000;
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[Cache] Redis connect failed; using memory cache');
    }
    return null;
  }
};

export const makeCacheKey = (namespace: string, params: Record<string, unknown> = {}) => {
  const normalized = JSON.stringify(normalizeForKey(params));
  const digest = createHash('sha256').update(normalized).digest('hex');
  return `${namespace}:${digest}`;
};

export const cacheGetOrSet = async <T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<{ value: T; hit: boolean }> => {
  const fullKey = namespacedKey(key);
  const redis = await getRedis();

  if (redis) {
    try {
      const cached = await redis.get(fullKey);
      if (cached) {
        return { value: JSON.parse(cached) as T, hit: true };
      }
    } catch {
      // Fall back to memory/database on malformed cache values or transient Redis errors.
    }
  }

  const now = Date.now();
  const memoryEntry = memoryCache.get(fullKey);
  if (memoryEntry && memoryEntry.expiresAt > now) {
    memoryCache.delete(fullKey);
    memoryCache.set(fullKey, memoryEntry);
    return { value: JSON.parse(memoryEntry.value) as T, hit: true };
  }
  if (memoryEntry) deleteMemoryEntry(fullKey);

  const value = await loader();
  const serialized = JSON.stringify(value);
  putMemoryEntry(fullKey, serialized, now + ttlSeconds * 1000);

  if (redis) {
    try {
      await redis.set(fullKey, serialized, 'EX', ttlSeconds);
    } catch {
      // Memory cache already has the value, so Redis write failures should not break requests.
    }
  }

  return { value, hit: false };
};

export const invalidateCacheByPrefix = async (prefixes: string[]) => {
  const fullPrefixes = prefixes.map((prefix) => namespacedKey(prefix));

  for (const key of Array.from(memoryCache.keys())) {
    if (fullPrefixes.some((prefix) => key.startsWith(prefix))) {
      deleteMemoryEntry(key);
    }
  }

  const redis = await getRedis();
  if (!redis) return;

  try {
    for (const prefix of fullPrefixes) {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', `${prefix}*`, 'COUNT', 100);
        cursor = nextCursor;
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      } while (cursor !== '0');
    }
  } catch {
    redisDisabledUntil = Date.now() + 30_000;
    if (process.env.NODE_ENV !== 'test') {
      console.warn('[Cache] Redis invalidation failed; local cache was cleared');
    }
  }
};
