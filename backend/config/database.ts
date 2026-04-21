import mongoose from 'mongoose';

async function connectDatabase(mongoUri: string | undefined): Promise<void> {
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set');
  }
  await mongoose.connect(mongoUri);
}

export { connectDatabase };
