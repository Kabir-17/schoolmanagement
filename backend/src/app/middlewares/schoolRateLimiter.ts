import rateLimit from 'express-rate-limit';
import { Request } from 'express';

/**
 * Per-school rate limiter middleware.
 *
 * This middleware prevents abuse by limiting requests per school (not per IP).
 * This is critical for multi-tenancy where multiple users from the same school
 * may share the same IP address (e.g., school network NAT).
 *
 * Features:
 * - Rate limits by schoolId instead of IP address
 * - Prevents one school from affecting others
 * - Simple memory-based store (resets on server restart)
 * - Can be upgraded to Redis for persistent rate limiting
 *
 * Usage:
 * Apply AFTER authentication middleware so req.user or req.school is available.
 *
 * @example
 * router.use('/api', authenticate, schoolRateLimiter, apiRoutes);
 */

export const schoolRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Per school (not per IP) - allows for ~13 requests per minute per school

  // Key by schoolId instead of IP
  keyGenerator: (req: Request) => {
    const contextId = (req as any)?.schoolContextId;
    if (contextId) {
      return `school:${contextId}`;
    }

    // Extract schoolId from authenticated user or school context
    // req.user is set by authenticate middleware
    // req.school is set by API key validation middleware (for auto-attend)
    const schoolId = (req.user as any)?.schoolId || (req as any).school?._id;

    if (schoolId) {
      return `school:${schoolId}`;
    }

    // Fallback to IP for unauthenticated requests (login, public routes)
    return `ip:${req.ip}`;
  },

  // Use memory store (resets on restart, but simple and no dependencies)
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers

  message: {
    error: 'Too many requests from your school. Please try again later.',
    retryAfter: 900, // 15 minutes in seconds
  },

  // Optional: Skip rate limiting for certain routes
  skip: (req: Request) => {
    // Allow health checks and status endpoints
    const path = req.path;
    return path === '/health' || path === '/api/status' || path === '/';
  },

  // Optional: Custom handler for rate limit exceeded
  handler: (req, res) => {
    console.warn(`[RateLimit] School rate limit exceeded: ${req.path}`, {
      schoolId: (req.user as any)?.schoolId || (req as any).school?._id || 'unknown',
      ip: req.ip,
      path: req.path,
    });

    res.status(429).json({
      success: false,
      message: 'Too many requests from your school. Please try again later.',
      retryAfter: 900, // seconds
    });
  },
});

/**
 * Stricter rate limiter for sensitive operations (login, registration, password reset).
 *
 * Lower limits to prevent brute force attacks.
 *
 * @example
 * router.post('/login', strictRateLimiter, loginController);
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Only 10 attempts per 15 minutes

  keyGenerator: (req: Request) => {
    // For auth routes, use IP + username combination to prevent targeted attacks
    const username = req.body?.username;
    if (username) {
      return `auth:${req.ip}:${username}`;
    }
    return `auth:${req.ip}`;
  },

  standardHeaders: true,
  legacyHeaders: false,

  message: {
    error: 'Too many authentication attempts. Please try again later.',
    retryAfter: 900,
  },

  handler: (req, res) => {
    console.warn(`[RateLimit] Strict rate limit exceeded (auth attempt)`, {
      ip: req.ip,
      username: req.body?.username,
      path: req.path,
    });

    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
      retryAfter: 900,
    });
  },
});

/**
 * Example Redis-based rate limiter configuration (commented out).
 *
 * To use Redis for persistent rate limiting across server restarts:
 * 1. Install: npm install redis rate-limit-redis
 * 2. Uncomment the code below
 * 3. Set REDIS_URL in .env
 */

/*
import RedisStore from 'rate-limit-redis';
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.connect().catch(console.error);

export const redisSchoolRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: async (req) => {
    // Dynamic limit based on school tier (if stored in school record)
    const school = (req as any).school;
    if (school?.tier === 'premium') return 500;
    return 200;
  },

  keyGenerator: (req: Request) => {
    const schoolId = (req.user as any)?.schoolId || (req as any).school?._id;
    return `school:${schoolId}`;
  },

  store: new RedisStore({
    // @ts-expect-error - Known typing issue with rate-limit-redis
    client: redisClient,
    prefix: 'rl:school:',
  }),

  message: 'School request limit exceeded. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
*/
