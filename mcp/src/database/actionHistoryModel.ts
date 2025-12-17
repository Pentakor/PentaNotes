import mongoose, { Schema, Document } from 'mongoose';
import { logger } from '../utils/logger';

// ---------------------------
// Types
// ---------------------------

export interface ActionPayload {
  toolName: string;
  args: Record<string, any>;
}

export interface EntitySnapshot {
  entityType: 'note' | 'folder' | 'tag';
  entityId: number;
  beforeSnapshot?: Record<string, any>; // null for create operations
  afterSnapshot?: Record<string, any>; // null for delete operations
}

export interface InverseOperation {
  operationType: 'create' | 'update' | 'delete';
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  payload?: Record<string, any>;
  noteId?: number; // For updates/deletes
}

export interface IActionHistory extends Document {
  requestId: string;
  userId: number;
  timestamp: Date;
  actions: Array<{
    toolName: string;
    args: Record<string, any>;
    result: Record<string, any>;
    entitySnapshots: EntitySnapshot[];
    inverseOperations: InverseOperation[];
  }>;
  status: 'completed' | 'reverted' | 'failed';
  errorMessage?: string;
  revertedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------
// Schema
// ---------------------------
const ActionHistorySchema = new Schema<IActionHistory>(
  {
    requestId: {
      type: String,
      required: true,
      index: true,
    },
    userId: {
      type: Number,
      required: true,
      index: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    actions: [
      {
        toolName: {
          type: String,
          required: true,
        },
        args: Schema.Types.Mixed,
        result: Schema.Types.Mixed,
        entitySnapshots: [
          {
            entityType: {
              type: String,
              enum: ['note', 'folder', 'tag'],
              required: true,
            },
            entityId: {
              type: Number,
              required: true,
            },
            beforeSnapshot: Schema.Types.Mixed,
            afterSnapshot: Schema.Types.Mixed,
          },
        ],
        inverseOperations: [
          {
            operationType: {
              type: String,
              enum: ['create', 'update', 'delete'],
              required: true,
            },
            endpoint: {
              type: String,
              required: true,
            },
            method: {
              type: String,
              enum: ['POST', 'PUT', 'DELETE'],
              required: true,
            },
            payload: Schema.Types.Mixed,
            noteId: Number,
          },
        ],
      },
    ],
    status: {
      type: String,
      enum: ['completed', 'reverted', 'failed'],
      default: 'completed',
      index: true,
    },
    errorMessage: String,
    revertedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Add TTL index to automatically expire documents 30 minutes after creation
ActionHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 1800 });

// Create compound index for efficient lookups
ActionHistorySchema.index({ userId: 1, requestId: 1 }, { unique: true });

// ---------------------------
// Model
// ---------------------------
const ActionHistoryModel = mongoose.model<IActionHistory>(
  'ActionHistory',
  ActionHistorySchema
);

// ---------------------------
// Database Service
// ---------------------------
export class ActionHistoryService {
  /**
   * Create a new action history record for a request
   */
  static async createRequest(
    requestId: string,
    userId: number
  ): Promise<IActionHistory> {
    try {
      const record = new ActionHistoryModel({
        requestId,
        userId,
        timestamp: new Date(),
        actions: [],
        status: 'completed',
      });

      await record.save();
      logger.debug('Created action history record', { requestId, userId });
      return record;
    } catch (error) {
      logger.error(
        'Failed to create action history record',
        error instanceof Error ? error : new Error(String(error)),
        { requestId, userId }
      );
      throw error;
    }
  }

  /**
   * Log an action to an existing request
   */
  static async logAction(
    requestId: string,
    userId: number,
    toolName: string,
    args: Record<string, any>,
    result: Record<string, any>,
    entitySnapshots: EntitySnapshot[],
    inverseOperations: InverseOperation[]
  ): Promise<void> {
    try {
      const record = await ActionHistoryModel.findOne({
        requestId,
        userId,
      });

      if (!record) {
        logger.warn('Action history record not found', { requestId, userId });
        return;
      }

      record.actions.push({
        toolName,
        args,
        result,
        entitySnapshots,
        inverseOperations,
      });

      await record.save();
      logger.debug('Logged action to history', {
        requestId,
        userId,
        toolName,
        actionCount: record.actions.length,
      });
    } catch (error) {
      logger.error(
        'Failed to log action',
        error instanceof Error ? error : new Error(String(error)),
        { requestId, userId, toolName }
      );
      throw error;
    }
  }

  /**
   * Get the latest request for a user
   */
  static async getLatestRequest(userId: number): Promise<IActionHistory | null> {
    try {
      const record = await ActionHistoryModel.findOne({
        userId,
        status: 'completed',
      }).sort({ timestamp: -1 });

      logger.debug('Retrieved latest action history record', {
        userId,
        found: !!record,
      });
      return record;
    } catch (error) {
      logger.error(
        'Failed to get latest action history',
        error instanceof Error ? error : new Error(String(error)),
        { userId }
      );
      return null;
    }
  }

  /**
   * Get a specific request by ID
   */
  static async getRequest(
    requestId: string,
    userId: number
  ): Promise<IActionHistory | null> {
    try {
      const record = await ActionHistoryModel.findOne({
        requestId,
        userId,
      });

      logger.debug('Retrieved action history record', {
        requestId,
        userId,
        found: !!record,
      });
      return record;
    } catch (error) {
      logger.error(
        'Failed to get action history',
        error instanceof Error ? error : new Error(String(error)),
        { requestId, userId }
      );
      return null;
    }
  }

  /**
   * Mark a request as reverted
   */
  static async markAsReverted(requestId: string, userId: number): Promise<void> {
    try {
      await ActionHistoryModel.updateOne(
        { requestId, userId },
        {
          status: 'reverted',
          revertedAt: new Date(),
        }
      );

      logger.info('Marked action history as reverted', { requestId, userId });
    } catch (error) {
      logger.error(
        'Failed to mark action history as reverted',
        error instanceof Error ? error : new Error(String(error)),
        { requestId, userId }
      );
      throw error;
    }
  }

  /**
   * Mark a request as failed
   */
  static async markAsFailed(
    requestId: string,
    userId: number,
    errorMessage: string
  ): Promise<void> {
    try {
      await ActionHistoryModel.updateOne(
        { requestId, userId },
        {
          status: 'failed',
          errorMessage,
        }
      );

      logger.warn('Marked action history as failed', {
        requestId,
        userId,
        errorMessage,
      });
    } catch (error) {
      logger.error(
        'Failed to mark action history as failed',
        error instanceof Error ? error : new Error(String(error)),
        { requestId, userId, errorMessage }
      );
      throw error;
    }
  }
}
