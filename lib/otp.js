import crypto from 'crypto';
import dbConnect from './mongodb.js';
import OtpChallenge from '../models/OtpChallenge.js';

const OTP_SECRET = process.env.OTP_SECRET || process.env.JWT_SECRET || 'almukammal-production-otp-secret-key-2026';
const OTP_EXPIRY_MINUTES = parseInt(process.env.OTP_EXPIRY_MINUTES || '5', 10);
const OTP_MAX_ATTEMPTS = parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10);
const OTP_RESEND_COOLDOWN_SECONDS = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS || '60', 10);

/**
 * Generate a cryptographically secure 6-digit numeric OTP on the server
 */
export function generateSecureOtp(length = 6) {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length);
  return crypto.randomInt(min, max).toString();
}

/**
 * Hash raw OTP using HMAC-SHA256
 */
export function hashOtp(rawOtp) {
  return crypto.createHmac('sha256', OTP_SECRET).update(String(rawOtp).trim()).digest('hex');
}

/**
 * Constant-time comparison to prevent timing attacks
 */
export function verifyHash(rawOtp, storedHash) {
  if (!rawOtp || !storedHash) return false;
  const computedHash = hashOtp(rawOtp);
  const bufA = Buffer.from(computedHash, 'utf8');
  const bufB = Buffer.from(storedHash, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Hash a reset authorization token
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(String(token).trim()).digest('hex');
}

/**
 * Create a new OTP challenge in DB
 */
export async function createOtpChallenge({ email, purpose, metadata = null }) {
  await dbConnect();
  const normalizedEmail = email.toLowerCase().trim();

  // Invalidate any existing unconsumed challenges for this email and purpose
  await OtpChallenge.updateMany(
    { email: normalizedEmail, purpose, consumedAt: null },
    { $set: { consumedAt: new Date() } }
  );

  const rawOtp = generateSecureOtp(6);
  const otpHash = hashOtp(rawOtp);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const challenge = await OtpChallenge.create({
    email: normalizedEmail,
    purpose,
    otpHash,
    attempts: 0,
    maxAttempts: OTP_MAX_ATTEMPTS,
    expiresAt,
    lastSentAt: now,
    consumedAt: null,
    metadata,
  });

  return {
    rawOtp,
    challengeId: challenge._id.toString(),
    expiresAt,
    expiryMinutes: OTP_EXPIRY_MINUTES,
    cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
  };
}

/**
 * Verify submitted OTP against DB challenge
 */
export async function verifyOtpChallenge({ email, purpose, rawOtp }) {
  await dbConnect();
  const normalizedEmail = email.toLowerCase().trim();

  // Find the latest unconsumed challenge for this email and purpose
  const challenge = await OtpChallenge.findOne({
    email: normalizedEmail,
    purpose,
    consumedAt: null,
  }).sort({ createdAt: -1 });

  if (!challenge) {
    return {
      valid: false,
      error: 'No active verification code found. Please request a new code.',
      code: 'NOT_FOUND',
    };
  }

  // Check expiration
  if (new Date() > challenge.expiresAt) {
    challenge.consumedAt = new Date();
    await challenge.save();
    return {
      valid: false,
      error: 'This verification code has expired. Request a new code.',
      code: 'EXPIRED',
    };
  }

  // Check attempt limit
  if (challenge.attempts >= challenge.maxAttempts) {
    challenge.consumedAt = new Date();
    await challenge.save();
    return {
      valid: false,
      error: 'Too many incorrect attempts. Please request a new verification code.',
      code: 'MAX_ATTEMPTS_EXCEEDED',
    };
  }

  // Verify hash
  const isMatch = verifyHash(rawOtp, challenge.otpHash);

  if (!isMatch) {
    challenge.attempts += 1;
    const remaining = challenge.maxAttempts - challenge.attempts;

    if (challenge.attempts >= challenge.maxAttempts) {
      challenge.consumedAt = new Date();
      await challenge.save();
      return {
        valid: false,
        error: 'Too many incorrect attempts. Please request a new verification code.',
        code: 'MAX_ATTEMPTS_EXCEEDED',
      };
    }

    await challenge.save();
    return {
      valid: false,
      error: `That code is incorrect. Please try again. (${remaining} attempts remaining)`,
      remainingAttempts: remaining,
      code: 'INVALID_CODE',
    };
  }

  // Success: mark OTP consumed
  challenge.consumedAt = new Date();
  await challenge.save();

  return {
    valid: true,
    challenge,
  };
}

/**
 * Create a short-lived reset authorization token upon successful password-reset OTP verification
 */
export async function createResetAuthorization(challengeId) {
  await dbConnect();
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(rawToken);
  const resetAuthExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes window

  await OtpChallenge.findByIdAndUpdate(challengeId, {
    resetAuthTokenHash: tokenHash,
    resetAuthExpiresAt,
  });

  return rawToken;
}

/**
 * Verify and consume reset authorization token before updating password
 */
export async function verifyAndConsumeResetAuthorization({ email, token }) {
  await dbConnect();
  const normalizedEmail = email.toLowerCase().trim();
  const tokenHash = hashToken(token);

  const challenge = await OtpChallenge.findOne({
    email: normalizedEmail,
    purpose: 'password_reset',
    resetAuthTokenHash: tokenHash,
    resetAuthExpiresAt: { $gt: new Date() },
  });

  if (!challenge) {
    return { valid: false, error: 'Invalid or expired password reset session. Please request a new code.' };
  }

  // Invalidate this authorization token so it cannot be reused
  challenge.resetAuthTokenHash = null;
  challenge.resetAuthExpiresAt = null;
  await challenge.save();

  return { valid: true };
}
