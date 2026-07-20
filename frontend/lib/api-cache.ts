import type { AxiosRequestConfig } from 'axios';
import api from './api';

type BrowserCacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const DEFAULT_TTL_MS = 45_000;
const responseCache = new Map<string, BrowserCacheEntry<unknown>>();
const inflightRequests = new Map<string, Promise<unknown>>();

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

const cacheKey = (url: string, config?: AxiosRequestConfig) =>
  `${url}:${JSON.stringify(normalizeForKey(config?.params || {}))}`;

export const cachedApiGet = async <T = unknown>(
  url: string,
  config?: AxiosRequestConfig,
  ttlMs = DEFAULT_TTL_MS,
): Promise<T> => {
  if (typeof window === 'undefined') {
    const response = await api.get<T>(url, config);
    return response.data;
  }

  const key = cacheKey(url, config);
  const cached = responseCache.get(key) as BrowserCacheEntry<T> | undefined;
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const inflight = inflightRequests.get(key) as Promise<T> | undefined;
  if (inflight) {
    return inflight;
  }

  const request = api
    .get<T>(url, config)
    .then((response) => {
      responseCache.set(key, {
        data: response.data,
        expiresAt: Date.now() + ttlMs,
      });
      return response.data;
    })
    .finally(() => {
      inflightRequests.delete(key);
    });

  inflightRequests.set(key, request);
  return request;
};

export const prefetchPublicRouteData = (href: string) => {
  if (typeof window === 'undefined') return;

  const route = href.split('?')[0].replace(/\/$/, '') || '/';
  const prefetches: Promise<unknown>[] = [];

  // The homepage content is bundled as local static data. Do not start
  // backend requests when its navigation links are touched on mobile; those
  // requests only compete with the initial document and image download.
  if (route === '/') {
    return;
  }

  if (route === '/jobs') {
    prefetches.push(cachedApiGet('/jobs'));
  } else if (route === '/trainings') {
    prefetches.push(cachedApiGet('/trainings'));
  } else if (route === '/services') {
    prefetches.push(cachedApiGet('/services', undefined, 60_000));
  } else if (route === '/about') {
    prefetches.push(cachedApiGet('/public/stats', undefined, 60_000));
  }

  if (prefetches.length > 0) {
    void Promise.allSettled(prefetches);
  }
};
