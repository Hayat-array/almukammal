// lib/auth.js
import jwt from 'jsonwebtoken';

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is missing in production');
    }
    return 'al-mukammal-dev-secret-key-min-32-chars-entropy!';
  }
  return secret;
};

/**
 * Verify JWT token and return decoded payload
 * @param {string} token - JWT token to verify
 * @returns {Promise<Object|null>} Decoded token payload or null
 */
export async function verifyToken(token) {
  try {
    if (!token) return null;
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret);
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Synchronous token verification for middleware/route handlers
 * @param {string} token 
 * @returns {Object|null}
 */
export function verifyTokenSync(token) {
  try {
    if (!token) return null;
    const secret = getJwtSecret();
    return jwt.verify(token, secret);
  } catch {
    return null;
  }
}

/**
 * Generate cryptographically signed JWT token
 * @param {Object} payload - Data to encode in token
 * @param {string} expiresIn - Expiration time (default: 7d)
 * @returns {string} Signed JWT token
 */
export function generateToken(payload, expiresIn = '7d') {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Extract token from Request (checking Authorization header and cookies)
 * @param {Request} request - Next.js request object
 * @returns {string|null} Token or null
 */
export function extractToken(request) {
  if (!request) return null;

  // 1. Try Authorization header
  const authHeader = request.headers?.get?.('authorization') || request.headers?.authorization;
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7).trim();
    }
    return authHeader.trim();
  }

  // 2. Try cookies
  if (request.cookies?.get) {
    const cookieToken = request.cookies.get('token')?.value;
    if (cookieToken) return cookieToken;
  }

  return null;
}

/**
 * Verify admin access from Request
 * @param {Request} request - Next.js request object
 * @returns {Promise<Object|null>} Decoded admin user or null
 */
export async function verifyAdmin(request) {
  const token = extractToken(request);
  if (!token) return null;

  const decoded = await verifyToken(token);
  if (!decoded || (decoded.role !== 'admin' && decoded.role !== 'manager')) {
    return null;
  }

  return decoded;
}

/**
 * Verify customer/user authentication from Request
 * @param {Request} request - Next.js request object
 * @returns {Promise<Object|null>} Decoded user object or null
 */
export async function verifyUser(request) {
  const token = extractToken(request);
  if (!token) return null;

  const decoded = await verifyToken(token);
  return decoded;
}

/**
 * Verify delivery partner authentication from Request
 * @param {Request} request - Next.js request object
 * @returns {Promise<Object|null>} Decoded user or null
 */
export async function verifyDeliveryPartner(request) {
  const token = extractToken(request);
  if (!token) return null;

  const decoded = await verifyToken(token);
  if (!decoded) return null;

  if (decoded.role === 'delivery_partner' || decoded.role === 'admin' || decoded.role === 'manager' || decoded.role === 'operations') {
    return decoded;
  }
  return null;
}

export default {
  verifyToken,
  verifyTokenSync,
  generateToken,
  extractToken,
  verifyAdmin,
  verifyUser,
  verifyDeliveryPartner
};