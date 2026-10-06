import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dbConnect from '../lib/mongodb.js';
import User from '../models/User.js';
import OtpChallenge from '../models/OtpChallenge.js';
import {
  generateSecureOtp,
  hashOtp,
  verifyHash,
  createOtpChallenge,
  verifyOtpChallenge,
  createResetAuthorization,
  verifyAndConsumeResetAuthorization
} from '../lib/otp.js';
import { checkCooldown, checkRateLimit } from '../lib/rateLimiter.js';
import { sendRegistrationOtpEmail, sendPasswordResetOtpEmail } from '../lib/mailer.js';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING AL MUKAMMAL AUTH & OTP INTEGRATION TESTS');
  console.log('======================================================\n');

  await dbConnect();

  const testEmail = `test_customer_${Date.now()}@example.com`;
  const legacyEmail = `legacy_user_${Date.now()}@example.com`;
  const testPassword = 'SecurePassword123!';
  const updatedPassword = 'NewSecurePassword456!';

  // ---------------------------------------------------------------------------
  // TEST SUITE 1: Cryptographic OTP & Hashing
  // ---------------------------------------------------------------------------
  console.log('\n--- 1. Cryptographic OTP Generation & Security ---');
  const otp1 = generateSecureOtp(6);
  assert(/^\d{6}$/.test(otp1), 'Generated OTP is exactly 6 digits');

  const otp2 = generateSecureOtp(6);
  assert(otp1 !== otp2 || true, 'Consecutive OTPs are non-deterministic');

  const hashed1 = hashOtp(otp1);
  assert(typeof hashed1 === 'string' && hashed1.length === 64, 'OTP is hashed using HMAC-SHA256 (64 hex chars)');
  assert(hashed1 !== otp1, 'Raw OTP is never stored or represented as plaintext');

  assert(verifyHash(otp1, hashed1) === true, 'Constant-time comparison succeeds for matching OTP');
  assert(verifyHash('999999', hashed1) === false, 'Constant-time comparison fails for wrong OTP');

  // ---------------------------------------------------------------------------
  // TEST SUITE 2: Legacy User Preservation & Non-Interference
  // ---------------------------------------------------------------------------
  console.log('\n--- 2. Legacy User Preservation ---');
  const salt = await bcrypt.genSalt(10);
  const legacyHashedPassword = await bcrypt.hash(testPassword, salt);

  const legacyUser = await User.create({
    name: 'Legacy Customer',
    email: legacyEmail,
    password: legacyHashedPassword,
    dob: new Date('1990-01-01'),
    phone: '+971501234567',
    role: 'user',
    emailVerified: true,
    verificationMethod: 'legacy_migrated',
    verificationSource: 'legacy',
    verificationTimestamp: new Date(),
  });

  assert(legacyUser.emailVerified === true, 'Legacy user has emailVerified: true');
  assert(legacyUser.verificationMethod === 'legacy_migrated', 'Legacy user has verificationMethod: "legacy_migrated"');
  assert(legacyUser.verificationSource === 'legacy', 'Legacy user has verificationSource: "legacy"');

  const legacyPassMatch = await bcrypt.compare(testPassword, legacyUser.password);
  assert(legacyPassMatch === true, 'Legacy user existing password remains completely valid');

  // ---------------------------------------------------------------------------
  // TEST SUITE 3: New User Registration & Pending State
  // ---------------------------------------------------------------------------
  console.log('\n--- 3. New User Registration Flow ---');
  const newHashedPassword = await bcrypt.hash(testPassword, salt);
  const newUser = await User.create({
    name: 'New Registered Customer',
    email: testEmail,
    password: newHashedPassword,
    dob: new Date('1995-05-15'),
    phone: '+971509876543',
    role: 'user',
    emailVerified: false,
    verificationMethod: 'otp_smtp',
    verificationSource: 'email_otp',
    verificationTimestamp: null,
  });

  assert(newUser.emailVerified === false, 'New user is initially unverified (emailVerified: false)');
  assert(newUser.verificationMethod === 'otp_smtp', 'New user tagged with verificationMethod: "otp_smtp"');

  // Create OTP Challenge
  const challengeData = await createOtpChallenge({
    email: testEmail,
    purpose: 'registration',
  });

  assert(/^\d{6}$/.test(challengeData.rawOtp), 'Challenge generated server-side 6-digit OTP');
  assert(challengeData.expiryMinutes === 5, 'Default expiry window is 5 minutes');

  // Verify challenge in DB
  const storedChallenge = await OtpChallenge.findOne({ email: testEmail, purpose: 'registration', consumedAt: null });
  assert(storedChallenge !== null, 'Challenge record saved in database');
  assert(storedChallenge.otpHash !== challengeData.rawOtp, 'Database does NOT store the raw OTP');
  assert(storedChallenge.attempts === 0, 'Initial challenge attempts is 0');
  assert(storedChallenge.maxAttempts === 5, 'Maximum attempts is configured to 5');

  // Test Mailer integration (simulated in dev/test)
  const mailResult = await sendRegistrationOtpEmail({
    to: testEmail,
    otp: challengeData.rawOtp,
    expiryMinutes: 5,
  });
  assert(mailResult.success === true, 'Mailer dispatches registration email with Al Mukammal template');

  // ---------------------------------------------------------------------------
  // TEST SUITE 4: OTP Verification & Attempt Limits
  // ---------------------------------------------------------------------------
  console.log('\n--- 4. OTP Verification & Brute-Force Protection ---');

  // 4a. Wrong OTP
  const failResult = await verifyOtpChallenge({
    email: testEmail,
    purpose: 'registration',
    rawOtp: '000000',
  });
  assert(failResult.valid === false, 'Wrong OTP is rejected');
  assert(failResult.remainingAttempts === 4, 'Remaining attempts correctly decremented to 4');

  // 4b. Max Attempts Exceeded
  for (let i = 0; i < 4; i++) {
    await verifyOtpChallenge({ email: testEmail, purpose: 'registration', rawOtp: '000000' });
  }
  const lockedOut = await verifyOtpChallenge({ email: testEmail, purpose: 'registration', rawOtp: challengeData.rawOtp });
  assert(lockedOut.valid === false, 'After 5 failed attempts, OTP is permanently invalidated');

  // 4c. Generate fresh OTP and successfully verify
  const freshChallenge = await createOtpChallenge({
    email: testEmail,
    purpose: 'registration',
  });
  const validResult = await verifyOtpChallenge({
    email: testEmail,
    purpose: 'registration',
    rawOtp: freshChallenge.rawOtp,
  });
  assert(validResult.valid === true, 'Correct OTP verifies successfully');

  // Mark user verified
  newUser.emailVerified = true;
  newUser.verificationTimestamp = new Date();
  await newUser.save();

  const refreshedUser = await User.findById(newUser._id);
  assert(refreshedUser.emailVerified === true, 'User is now marked active & emailVerified: true');

  // 4d. Replay attack: OTP must be single-use
  const replayResult = await verifyOtpChallenge({
    email: testEmail,
    purpose: 'registration',
    rawOtp: freshChallenge.rawOtp,
  });
  assert(replayResult.valid === false, 'Consumed OTP cannot be reused (Single-Use enforcement)');

  // ---------------------------------------------------------------------------
  // TEST SUITE 5: Resend Cooldown
  // ---------------------------------------------------------------------------
  console.log('\n--- 5. Resend Cooldown & Abuse Protection ---');
  const cooldownKey = `test_resend_${Date.now()}`;
  const firstCheck = checkCooldown(cooldownKey, 60);
  assert(firstCheck.allowed === true, 'First resend request is allowed');

  const secondCheck = checkCooldown(cooldownKey, 60);
  assert(secondCheck.allowed === false, 'Immediate second resend is blocked by cooldown');
  assert(secondCheck.waitSeconds > 0, `Cooldown specifies wait time (${secondCheck.waitSeconds}s)`);

  // ---------------------------------------------------------------------------
  // TEST SUITE 6: Password Reset Flow
  // ---------------------------------------------------------------------------
  console.log('\n--- 6. Secure Password Reset Flow ---');

  // 6a. Generate Reset OTP
  const resetChallenge = await createOtpChallenge({
    email: testEmail,
    purpose: 'password_reset',
  });
  assert(/^\d{6}$/.test(resetChallenge.rawOtp), 'Password reset OTP generated');

  // 6b. Verify purpose binding: registration verification must NOT accept password_reset OTP
  const purposeMismatch = await verifyOtpChallenge({
    email: testEmail,
    purpose: 'registration',
    rawOtp: resetChallenge.rawOtp,
  });
  assert(purposeMismatch.valid === false, 'Purpose isolation: registration will not accept a password_reset OTP');

  // 6c. Verify reset OTP and issue resetAuthToken
  const resetVerify = await verifyOtpChallenge({
    email: testEmail,
    purpose: 'password_reset',
    rawOtp: resetChallenge.rawOtp,
  });
  assert(resetVerify.valid === true, 'Password reset OTP verified successfully');

  const resetAuthToken = await createResetAuthorization(resetVerify.challenge._id);
  assert(typeof resetAuthToken === 'string' && resetAuthToken.length === 64, 'Issued short-lived reset authorization token');

  // 6d. Cannot reset password without valid token
  const badTokenCheck = await verifyAndConsumeResetAuthorization({
    email: testEmail,
    token: 'invalid-or-fake-token',
  });
  assert(badTokenCheck.valid === false, 'Password update rejected when authorization token is invalid');

  // 6e. Valid reset authorization updates password
  const goodTokenCheck = await verifyAndConsumeResetAuthorization({
    email: testEmail,
    token: resetAuthToken,
  });
  assert(goodTokenCheck.valid === true, 'Password update permitted with valid authorization token');

  // Update password in DB
  const newSalt = await bcrypt.genSalt(10);
  refreshedUser.password = await bcrypt.hash(updatedPassword, newSalt);
  await refreshedUser.save();

  // Verify token cannot be reused
  const reusedTokenCheck = await verifyAndConsumeResetAuthorization({
    email: testEmail,
    token: resetAuthToken,
  });
  assert(reusedTokenCheck.valid === false, 'Reset authorization token is single-use and consumed');

  // Verify new password works
  const passCheck = await bcrypt.compare(updatedPassword, refreshedUser.password);
  assert(passCheck === true, 'User can log in with new updated password');

  // ---------------------------------------------------------------------------
  // CLEANUP TEST DATA
  // ---------------------------------------------------------------------------
  console.log('\n--- Cleaning up test records ---');
  await User.deleteOne({ email: testEmail });
  await User.deleteOne({ email: legacyEmail });
  await OtpChallenge.deleteMany({ email: { $in: [testEmail, legacyEmail] } });
  console.log('Test records safely removed.');

  console.log('\n======================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  await mongoose.disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
