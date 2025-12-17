import {
  deleteNote,
  deleteFolder,
  updateNote,
  getNoteById,
} from '../tools/backendapi';
import {
  ActionHistoryService,
  IActionHistory,
  InverseOperation,
} from '../database/actionHistoryModel';
import { logger } from './logger';

// ---------------------------
// Revert Service
// ---------------------------

export interface RevertResult {
  success: boolean;
  message: string;
  operationsReverted: number;
  errors: string[];
}

/**
 * Execute a single inverse operation
 */
async function executeInverseOperation(
  operation: InverseOperation,
  token: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!token) {
      return { success: false, error: 'No authentication token provided' };
    }

    const { operationType, endpoint, method, payload, noteId } = operation;

    switch (operationType) {
      case 'delete': {
        // Delete endpoint should be /api/notes/{id}/ or /api/folders/{id}/
        if (endpoint.includes('/notes/')) {
          const noteIdFromEndpoint = parseInt(
            endpoint.match(/\/notes\/(\d+)\//)?.[1] || '0'
          );
          if (noteIdFromEndpoint) {
            await deleteNote(noteIdFromEndpoint, token);
            return { success: true };
          }
        } else if (endpoint.includes('/folders/')) {
          const folderIdFromEndpoint = parseInt(
            endpoint.match(/\/folders\/(\d+)\//)?.[1] || '0'
          );
          if (folderIdFromEndpoint) {
            await deleteFolder(folderIdFromEndpoint, token);
            return { success: true };
          }
        }
        return {
          success: false,
          error: `Could not parse entity ID from endpoint: ${endpoint}`,
        };
      }

      case 'update': {
        // Update endpoint should be /api/notes/{id}/
        if (endpoint.includes('/notes/') && noteId && payload) {
          await updateNote(noteId, payload, token);
          return { success: true };
        }
        return {
          success: false,
          error: `Could not execute update for endpoint: ${endpoint}`,
        };
      }

      case 'create': {
        // Create operations don't need inverse (they are handled by the original create action)
        return { success: true };
      }

      default:
        return { success: false, error: `Unknown operation type: ${operationType}` };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

/**
 * Revert all actions from a specific AI request
 * Executes inverse operations in reverse order for consistency
 */
export async function revertRequest(
  requestId: string,
  userId: number,
  token: string | null
): Promise<RevertResult> {
  logger.info('Starting revert operation', { requestId, userId });

  try {
    // Fetch the action history record
    const actionHistory = await ActionHistoryService.getRequest(requestId, userId);

    if (!actionHistory) {
      logger.warn('Action history record not found', { requestId, userId });
      return {
        success: false,
        message: 'Could not find action history for this request',
        operationsReverted: 0,
        errors: ['Action history record not found'],
      };
    }

    // Check if already reverted
    if (actionHistory.status === 'reverted') {
      logger.warn('Attempt to revert already reverted action', {
        requestId,
        userId,
      });
      return {
        success: false,
        message: 'This request has already been reverted',
        operationsReverted: 0,
        errors: ['Request already reverted'],
      };
    }

    // Collect all inverse operations in reverse order
    const allInverseOperations: Array<{
      operation: InverseOperation;
      actionIndex: number;
    }> = [];

    actionHistory.actions.forEach((action, actionIndex) => {
      action.inverseOperations.forEach((operation) => {
        allInverseOperations.push({ operation, actionIndex });
      });
    });

    // Reverse the order for proper rollback (last action first)
    allInverseOperations.reverse();

    logger.debug('Executing inverse operations', {
      requestId,
      userId,
      operationCount: allInverseOperations.length,
    });

    const errors: string[] = [];
    let successCount = 0;

    // Execute all inverse operations
    for (const { operation, actionIndex } of allInverseOperations) {
      const result = await executeInverseOperation(operation, token);

      if (result.success) {
        successCount++;
        logger.debug('Inverse operation executed successfully', {
          requestId,
          actionIndex,
          operationType: operation.operationType,
        });
      } else {
        const errorMsg = `Action ${actionIndex}: ${result.error || 'Unknown error'}`;
        errors.push(errorMsg);
        logger.warn('Inverse operation failed', {
          requestId,
          actionIndex,
          error: result.error,
        });
      }
    }

    // If all operations succeeded, mark as reverted
    if (errors.length === 0 && successCount > 0) {
      await ActionHistoryService.markAsReverted(requestId, userId);
      logger.info('Revert operation completed successfully', {
        requestId,
        userId,
        operationsReverted: successCount,
      });

      return {
        success: true,
        message: `Successfully reverted ${successCount} action(s)`,
        operationsReverted: successCount,
        errors: [],
      };
    } else if (successCount > 0) {
      // Partial success - some operations failed
      logger.warn('Revert operation partially completed', {
        requestId,
        userId,
        successCount,
        failureCount: errors.length,
      });

      return {
        success: false,
        message: `Partially reverted: ${successCount} action(s) succeeded, ${errors.length} failed`,
        operationsReverted: successCount,
        errors,
      };
    } else {
      // All operations failed
      logger.error(
        'Revert operation failed completely',
        new Error(errors.join('; ')),
        {
          requestId,
          userId,
          errorCount: errors.length,
        }
      );

      return {
        success: false,
        message: 'Failed to revert any actions',
        operationsReverted: 0,
        errors,
      };
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    logger.error(
      'Revert operation error',
      error instanceof Error ? error : new Error(errorMessage),
      { requestId, userId }
    );

    return {
      success: false,
      message: 'An error occurred during revert',
      operationsReverted: 0,
      errors: [errorMessage],
    };
  }
}

/**
 * Get the status of a request (whether it can be reverted, already reverted, etc.)
 */
export async function getRequestStatus(
  requestId: string,
  userId: number
): Promise<{
  status: 'completed' | 'reverted' | 'failed' | 'not-found';
  message: string;
  actionCount?: number;
  revertedAt?: Date;
}> {
  try {
    const actionHistory = await ActionHistoryService.getRequest(
      requestId,
      userId
    );

    if (!actionHistory) {
      return { status: 'not-found', message: 'Request not found' };
    }

    return {
      status: actionHistory.status,
      message: `Request status: ${actionHistory.status}`,
      actionCount: actionHistory.actions.length,
      revertedAt: actionHistory.revertedAt,
    };
  } catch (error) {
    logger.error(
      'Failed to get request status',
      error instanceof Error ? error : new Error(String(error)),
      { requestId, userId }
    );
    return {
      status: 'not-found',
      message: 'Failed to retrieve request status',
    };
  }
}
