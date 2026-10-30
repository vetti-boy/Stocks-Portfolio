import mongoose from 'mongoose';

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://mailfortempusage_db_user:iWOS9kqpsY1H1HjR@stockportfolio.0cbqve4.mongodb.net/test?retryWrites=true&w=majority';

// In serverless environments (Vercel), disable operation buffering so queries fail fast rather than timing out after 10000ms
mongoose.set('bufferCommands', false);

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
  if (cached?.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached?.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
    };

    cached!.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => {
        console.log('Successfully connected to MongoDB Cloud Database (Atlas).');
        return m;
      })
      .catch((err) => {
        console.error('MongoDB Atlas connection error:', err.message);
        cached!.promise = null;
        cached!.conn = null;
        throw err;
      });
  }

  try {
    const conn = await cached!.promise;
    if (mongoose.connection.readyState === 1) {
      cached!.conn = conn;
      return conn;
    }
    cached!.conn = null;
    cached!.promise = null;
    return null;
  } catch (e: any) {
    cached!.promise = null;
    cached!.conn = null;
    console.error('connectToDatabase failure:', e?.message);
    return null;
  }
}
