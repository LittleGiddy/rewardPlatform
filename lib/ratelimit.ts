import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { NextRequest } from 'next/server';

type Window = Parameters<typeof Ratelimit.slidingWindow>[1];

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!redisUrl || !redisToken) return null;
  if (!redis) {
    redis = new Redis({ url: redisUrl, token: redisToken });
  }
  return redis;
}

const limiters = new Map<string, Ratelimit>();

function getLimiter(name: string, limit: number, window: Window): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;

  const key = `${name}:${limit}:${String(window)}`;
  let limiter = limiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: client,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `rl:${name}`,
      analytics: false,
    });
    limiters.set(key, limiter);
  }
  return limiter;
}

export function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Best-effort rate limiting. If Upstash env vars are not configured the
 * request is allowed through so the app never hard-depends on Redis.
 */
export async function rateLimit(
  name: string,
  limit: number,
  window: Window,
  identifier: string
): Promise<RateLimitResult> {
  const limiter = getLimiter(name, limit, window);
  if (!limiter) {
    return { success: true, limit, remaining: limit, reset: 0 };
  }

  try {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error('[RATE_LIMIT] Falling back to allow:', error);
    return { success: true, limit, remaining: limit, reset: 0 };
  }
}

export function tooManyRequests(reset: number) {
  const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please slow down and try again later.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    }
  );
}
