
import mongoose from 'mongoose';
import dns from 'dns';

// Fix querySrv ETIMEOUT on Windows / certain ISPs by using reliable Google & Cloudflare DNS resolvers
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  // Fallback to default if setServers is restricted
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 20,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 15000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB connected successfully');
      return mongoose;
    }).catch((err) => {
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('❌ MongoDB connection error:', e);
    throw e;
  }

  return cached.conn;
}

// 🔥 EXPORTS
export { dbConnect, dbConnect as connectDB };
export default dbConnect;