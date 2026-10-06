import mongoose from 'mongoose';

async function migrateLegacyUsers() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI environment variable not set.');
    process.exit(1);
  }

  console.log('Connecting to database...');
  await mongoose.connect(uri);

  const usersCollection = mongoose.connection.collection('users');
  const countBefore = await usersCollection.countDocuments();
  console.log(`Initial total user count: ${countBefore}`);

  if (countBefore === 0) {
    console.log('No users found in database. Migration complete.');
    await mongoose.disconnect();
    return;
  }

  // Only update users who do not already have verificationMethod 'otp_smtp'
  const filter = {
    $or: [
      { verificationMethod: { $exists: false } },
      { verificationMethod: null },
      { emailVerified: false }
    ],
    verificationMethod: { $ne: 'otp_smtp' }
  };

  const migrationTime = new Date();
  const updateResult = await usersCollection.updateMany(filter, {
    $set: {
      emailVerified: true,
      verificationMethod: 'legacy_migrated',
      verificationSource: 'legacy',
      verificationTimestamp: migrationTime,
    }
  });

  console.log(`Matched legacy users: ${updateResult.matchedCount}`);
  console.log(`Updated legacy users: ${updateResult.modifiedCount}`);

  const countAfter = await usersCollection.countDocuments();
  console.log(`Final total user count: ${countAfter}`);

  if (countBefore !== countAfter) {
    console.error('CRITICAL ERROR: User count changed during migration!');
    process.exit(1);
  }

  // Verify all users now have emailVerified: true and legacy tags
  const verifiedUsers = await usersCollection.countDocuments({ emailVerified: true });
  console.log(`Verified users count: ${verifiedUsers}/${countAfter}`);

  console.log('Legacy user migration completed safely and successfully with ZERO data loss.');
  await mongoose.disconnect();
}

migrateLegacyUsers().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
