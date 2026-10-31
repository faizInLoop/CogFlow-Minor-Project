import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let memoryServer = null;

async function connectExternal(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 1500 });
  return { mode: uri.includes('127.0.0.1') || uri.includes('localhost') ? 'local' : 'external', uri };
}

export async function connectDb() {
  const configured = process.env.MONGODB_URI;
  if (configured) return connectExternal(configured);

  try {
    return await connectExternal('mongodb://127.0.0.1:27017/cogflow');
  } catch (error) {
    console.log(`[CogFlow] Local MongoDB is not running (${error.message}). Starting an embedded MongoDB for this project.`);
    const dbPath = path.join(__dirname, 'data', 'mongo');
    fs.mkdirSync(dbPath, { recursive: true });
    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbName: 'cogflow',
        dbPath,
        storageEngine: 'wiredTiger',
      },
    });
    const uri = memoryServer.getUri();
    await mongoose.connect(uri);
    return { mode: 'embedded', uri };
  }
}

export async function disconnectDb() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
