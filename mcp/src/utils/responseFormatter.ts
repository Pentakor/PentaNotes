import { Response } from 'express';
import { logger } from './logger';

// ---------------------------
// Response Types
// ---------------------------
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  message: string;
  data?: T;
  error?: string;
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
  statusCode: number = 200
): Response {
  logger.debug('Sending success response', { statusCode });
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
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
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.debug('Sending error response', { statusCode, message });
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
