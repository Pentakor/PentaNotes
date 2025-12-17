import mongoose from 'mongoose';
import { MONGODB_URI } from '../config/env';
import { logger } from '../utils/logger';

// ---------------------------
// Database Connection
// ---------------------------
export async function connectDatabase(): Promise<void> {
  try {
    logger.info('Connecting to MongoDB', { uri: MONGODB_URI.replace(/:[^:]*@/, ':****@') });

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error(
      'Failed to connect to MongoDB',
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
}

/**
 * Disconnect from MongoDB
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected');
  } catch (error) {
    logger.error(
      'Failed to disconnect from MongoDB',
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Check if connected to MongoDB
 */
export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
