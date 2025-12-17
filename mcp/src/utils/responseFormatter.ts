import { Response } from 'express';
import { logger } from './logger';

// ---------------------------
// Response Types
// ---------------------------
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  changed?: string[];
  requestId?: string;
  actionCount?: number;
  error?: string | Record<string, any>;
}

// ---------------------------
// Helper: Extract clean error message
// ---------------------------
function extractErrorMessage(error: string | Error): string {
  let errorMessage = error instanceof Error ? error.message : String(error);

  // If the error message is a JSON string (from nested errors), try to parse it
  try {
    if (errorMessage.startsWith('{')) {
      const parsed = JSON.parse(errorMessage);
      // Extract the most relevant error message
      if (typeof parsed === 'object' && parsed !== null) {
        if (parsed.error?.message) {
          return parsed.error.message;
        }
        if (parsed.message) {
          return parsed.message;
        }
      }
    }
  } catch {
    // If parsing fails, just use the original message
  }

  return errorMessage;
}

// ---------------------------
// Response Formatter
// ---------------------------
/**
 * Send success response
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200,
  changed?: string[],
  requestId?: string,
  actionCount?: number
): Response {
  logger.debug('Sending success response', { statusCode, requestId, actionCount });
  const response: any = {
    status: 'success',
    message,
    data,
  };
  if (changed && changed.length > 0) {
    response.changed = changed;
  }
  if (requestId) {
    response.requestId = requestId;
  }
  if (actionCount !== undefined) {
    response.actionCount = actionCount;
  }
  return res.status(statusCode).json(response);
}

/**
 * Send error response
 */
export function sendError(
  res: Response,
  message: string,
  error: string | Error,
  statusCode: number = 500
): Response {
  const errorMessage = extractErrorMessage(error);
  logger.debug('Sending error response', { statusCode, message, errorMessage });
  return res.status(statusCode).json({
    status: 'error',
    message,
    error: errorMessage,
  });
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error,
  res: Response,
  context?: Record<string, any>
): Response {
  logger.error('Unhandled error in request', err, context);

  return sendError(
    res,
    'An unexpected error occurred',
    err.message,
    500
  );
}
