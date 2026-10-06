import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stocks-portfolio-db';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose | null> {
  if (cached?.conn) {
    return cached.conn;
  }

  if (!cached?.promise) {
    const opts = {
      serverSelectionTimeoutMS: 10000,
    };

    cached!.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
      console.log('Successfully connected to MongoDB Cloud Database (Atlas).');
      return m;
    }).catch((err) => {
      console.warn('MongoDB connection warning:', err.message);
      cached!.promise = null;
      return null as any;
    });
  }

  try {
    const conn = await cached!.promise;
    if (!conn || mongoose.connection.readyState !== 1) {
      cached!.conn = null;
      return null;
    }
    cached!.conn = conn;
    return conn;
  } catch (e) {
    cached!.promise = null;
    cached!.conn = null;
    return null;
  }
}
