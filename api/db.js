// Shared MongoDB connection utility for serverless functions
import { MongoClient } from 'mongodb';

// MongoDB connection string from environment variable
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rohitmanon2:iamunique7$@cluster0.bvvvhfs.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const MONGODB_DB = process.env.MONGODB_DB || 'insta_detoxify';

// Cache the database connection in global scope for lambda reuse
let cachedClient = null;
let cachedDb = null;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

if (!MONGODB_DB) {
  throw new Error('Please define the MONGODB_DB environment variable');
}

/**
 * Global is used here to maintain a cached connection across function calls.
 * This is important for serverless environments where functions can be reused.
 */
let cached = global.mongo;
if (!cached) {
  cached = global.mongo = { conn: null, promise: null };
}

export async function connectToDatabase() {
  // If we have a cached connection, use it
  if (cached.conn) {
    return cached.conn;
  }

  // If there's no cached connection but a connection is being established, wait for it
  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    };

    cached.promise = MongoClient.connect(MONGODB_URI, opts)
      .then((client) => {
        return {
          client,
          db: client.db(MONGODB_DB),
        };
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
} 