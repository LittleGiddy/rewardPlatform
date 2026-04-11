import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose ?? { conn: null, promise: null };
global.mongoose = cached;

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      family: 4,
    };
    
    console.log('Creating new MongoDB connection...');
    cached.promise = mongoose.connect(MONGODB_URI, opts).then(async (mongoose) => {
      console.log('MongoDB connected successfully');
      
      // Handle index creation gracefully
      try {
        // Drop problematic index if it exists
        const collection = mongoose.connection.collection('vouchers');
        const indexes = await collection.indexes();
        const problematicIndex = indexes.find(idx => idx.name === 'voucherCode_1');
        
        if (problematicIndex) {
          console.log('Dropping conflicting index: voucherCode_1');
          await collection.dropIndex('voucherCode_1');
        }
      } catch (error) {
        console.log('Index cleanup error (can be ignored):', error);
      }
      
      return mongoose;
    }).catch((err) => {
      console.error('MongoDB connection error:', err);
      cached.promise = null;
      throw err;
    });
  }
  
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;