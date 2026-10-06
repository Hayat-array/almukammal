/**
 * In-Memory Sliding Window Rate Limiter & Cooldown Tracker
 * Protects auth endpoints against brute force, enumeration, and abuse.
 */

// Store limits in memory (keyed by action:identifier)
const hitStore = new Map();
const cooldownStore = new Map();

// Periodic cleanup every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of hitStore.entries()) {
      if (value.resetAt <= now) {
        hitStore.delete(key);
      }
    }
    for (const [key, timestamp] of cooldownStore.entries()) {
      if (timestamp <= now) {
        cooldownStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  if (cleanupTimer.unref) cleanupTimer.unref();
}

/**
 * Check and record a hit against a rate limit window
 * @param {string} key - Unique key, e.g. `register:ip:${ip}` or `verify:email:${email}`
 * @param {number} maxHits - Maximum permitted requests in window
 * @param {number} windowSeconds - Duration of window in seconds
 * @returns {{ allowed: boolean, remaining: number, resetInSeconds: number }}
 */
export function checkRateLimit(key, maxHits = 5, windowSeconds = 900) {
  const now = Date.now();
  const entry = hitStore.get(key);

  if (!entry || entry.resetAt <= now) {
    hitStore.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { allowed: true, remaining: maxHits - 1, resetInSeconds: windowSeconds };
  }

  if (entry.count >= maxHits) {
    const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, remaining: 0, resetInSeconds };
  }

  entry.count += 1;
  const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000);
  return { allowed: true, remaining: maxHits - entry.count, resetInSeconds };
}

/**
 * Check and enforce cooldown (e.g. 60 seconds between resends)
 * @param {string} key - Unique key, e.g. `cooldown:resend:${email}`
 * @param {number} cooldownSeconds - Minimum seconds between actions
 * @returns {{ allowed: boolean, waitSeconds: number }}
 */
export function checkCooldown(key, cooldownSeconds = 60) {
  const now = Date.now();
  const availableAt = cooldownStore.get(key) || 0;

  if (now < availableAt) {
    const waitSeconds = Math.ceil((availableAt - now) / 1000);
    return { allowed: false, waitSeconds };
  }

  cooldownStore.set(key, now + cooldownSeconds * 1000);
  return { allowed: true, waitSeconds: 0 };
}

/**
 * Get client IP safely from request headers
 * @param {Request} request 
 * @returns {string}
 */
export function getClientIp(request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '127.0.0.1';
}
