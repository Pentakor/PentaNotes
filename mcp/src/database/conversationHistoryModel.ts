import mongoose, { Schema, Document } from 'mongoose';
import { Content } from '../types/content';
import { logger } from '../utils/logger';

// ---------------------------
// Types
// ---------------------------
export interface IConversationHistory extends Document {
  userId: number;
  contents: Content[];
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------
// Schema
// ---------------------------
const ConversationHistorySchema = new Schema<IConversationHistory>(
  {
    userId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    contents: {
      type: Schema.Types.Mixed,
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Add TTL index to automatically expire documents 30 minutes after creation
ConversationHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 1800 });

// ---------------------------
// Model
// ---------------------------
const ConversationHistoryModel = mongoose.model<IConversationHistory>(
  'ConversationHistory',
  ConversationHistorySchema
);

// ---------------------------
// Database Service
// ---------------------------
export class ConversationHistoryService {
  /**
   * Get conversation history for a user
   */
  static async getHistory(userId: number): Promise<Content[]> {
    try {
      const doc = await ConversationHistoryModel.findOne({ userId });
      return doc ? (doc.contents as Content[]) : [];
    } catch (error) {
      logger.error(
        'Failed to get conversation history',
        error instanceof Error ? error : new Error(String(error)),
        { userId }
      );
      return [];
    }
  }

  /**
   * Add messages to conversation history
   */
  static async addToHistory(
    userId: number,
    userMessage: string,
    aiResponse: string,
    maxMessages: number
  ): Promise<void> {
    try {
      let doc = await ConversationHistoryModel.findOne({ userId });

      if (!doc) {
        doc = new ConversationHistoryModel({
          userId,
          contents: [],
        });
      }

      // Add user message
      (doc.contents as Content[]).push({
        role: 'user',
        parts: [{ text: userMessage }],
      });

      // Add AI response
      (doc.contents as Content[]).push({
        role: 'model',
        parts: [{ text: aiResponse }],
      });

      // Keep only last N pairs (N*2 messages since each pair = user + model)
      const maxTotalMessages = maxMessages * 2;
      if (doc.contents.length > maxTotalMessages) {
        doc.contents = (doc.contents as Content[]).slice(
          -maxTotalMessages
        );
      }

      await doc.save();
      logger.debug('Conversation history saved', { userId, messageCount: doc.contents.length });
    } catch (error) {
      logger.error(
        'Failed to add to conversation history',
        error instanceof Error ? error : new Error(String(error)),
        { userId }
      );
      throw error;
    }
  }

  /**
   * Clear conversation history for a user
   */
  static async clearHistory(userId: number): Promise<void> {
    try {
      await ConversationHistoryModel.deleteOne({ userId });
      logger.info('Conversation history cleared', { userId });
    } catch (error) {
      logger.error(
        'Failed to clear conversation history',
        error instanceof Error ? error : new Error(String(error)),
        { userId }
      );
      throw error;
    }
  }

  /**
   * Clear all conversation history
   */
  static async clearAllHistory(): Promise<void> {
    try {
      await ConversationHistoryModel.deleteMany({});
      logger.info('All conversation history cleared');
    } catch (error) {
      logger.error(
        'Failed to clear all conversation history',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
}
