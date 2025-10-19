// lib/auth.js
import jwt from 'jsonwebtoken';

// Get JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

/**
 * Verify JWT token and return decoded payload
 * @param {string} token - JWT token to verify
 * @returns {Promise<Object>} Decoded token payload
 */
export async function verifyToken(token) {
  try {
    if (!token) {
      throw new Error('No token provided');
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error.message);
    return null;
  }
}

/**
 * Generate JWT token
 * @param {Object} payload - Data to encode in token
 * @param {string} expiresIn - Token expiration time (default: 7d)
 * @returns {string} JWT token
 */
export function generateToken(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Extract token from Authorization header
 * @param {Request} request - Next.js request object
 * @returns {string|null} Token or null
 */
export function extractToken(request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return null;
  }

  // Handle "Bearer token" format
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return authHeader;
}

/**
 * Middleware to verify admin access
 * @param {Request} request - Next.js request object
 * @returns {Promise<Object>} User object or null
 */
export async function verifyAdmin(request) {
  const token = extractToken(request);
  
  if (!token) {
    return null;
  }

  const decoded = await verifyToken(token);
  
  if (!decoded || decoded.role !== 'admin') {
    return null;
  }

  return decoded;
}

/**
 * Middleware to verify user authentication
 * @param {Request} request - Next.js request object
 * @returns {Promise<Object>} User object or null
 */
export async function verifyUser(request) {
  const token = extractToken(request);
  
  if (!token) {
    return null;
  }

  const decoded = await verifyToken(token);
  return decoded;
}
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// ✅ YOUR EXISTING SESSION HELPER
export async function getSession(request) {
  try {
    const session = await getServerSession(authOptions);
    return session?.user ? {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      role: session.user.role || 'user' // ✅ YOUR ROLES!
    } : null;
  } catch (error) {
    console.error('❌ Auth Error:', error);
    return null;
  }
}

// ✅ CLIENT TOKEN HELPER (for frontend)
export function getClientToken() {
  return localStorage.getItem('token');
}

// ✅ BACKEND TOKEN HELPER
export async function getServerToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  
  const token = authHeader.replace('Bearer ', '');
  const session = await getSession(request);
  return session?.user ? {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role || 'user'
  } : null;
}