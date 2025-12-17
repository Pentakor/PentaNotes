import {
  createNote,
  updateNote,
  getFolders,
  getTags,
  getNotes,
  createFolder,
  deleteNote,
  deleteFolder,
  getNoteById,
  getFolderById,
} from '../tools/backendapi';
import {
  ActionHistoryService,
  EntitySnapshot,
  InverseOperation,
} from '../database/actionHistoryModel';
import { logger } from './logger';

// ---------------------------
// Types
// ---------------------------
export interface ToolExecutionContext {
  requestId: string;
  userId: number;
}

// ---------------------------
// Tool Implementation Map
// ---------------------------
const toolImplementations: Record<string, Function> = {
  'create-note': async (args: any) => {
    const { title, content, folderId, token } = args;
    return createNote(title, content || '', token, folderId);
  },

  'update-note': async (args: any) => {
    const { noteId, title, content, folderId, token } = args;
    return updateNote(noteId, { title, content, folderId }, token);
  },

  'get-folders': async (args: any) => {
    const { token } = args;
    return getFolders(token);
  },

  'get-tags': async (args: any) => {
    const { token } = args;
    return getTags(token);
  },

  'get-notes': async (args: any) => {
    const { token } = args;
    return getNotes(token);
  },

  'create-folder': async (args: any) => {
    const { title, token } = args;
    return createFolder(title, token);
  },
};

// ---------------------------
// Helper: Determine if tool modifies data
// ---------------------------
function isModifyingTool(toolName: string): boolean {
  const modifyingTools = [
    'create-note',
    'update-note',
    'create-folder',
    'delete-note',
    'delete-folder',
  ];
  return modifyingTools.includes(toolName);
}

// ---------------------------
// Helper: Build inverse operations
// ---------------------------
async function buildInverseOperations(
  toolName: string,
  args: Record<string, any>,
  result: any,
  token: string | null,
  beforeSnapshot?: any
): Promise<{
  entitySnapshots: EntitySnapshot[];
  inverseOperations: InverseOperation[];
}> {
  const entitySnapshots: EntitySnapshot[] = [];
  const inverseOperations: InverseOperation[] = [];

  try {
    switch (toolName) {
      case 'create-note': {
        // For create, inverse is delete
        const createdNote = result?.data?.note;
        if (createdNote) {
          const noteId = createdNote.id;
          entitySnapshots.push({
            entityType: 'note',
            entityId: noteId,
            afterSnapshot: createdNote,
          });
          inverseOperations.push({
            operationType: 'delete',
            endpoint: `/api/notes/${noteId}/`,
            method: 'DELETE',
            noteId,
          });
        }
        break;
      }

      case 'update-note': {
        // For update, inverse is restore previous snapshot
        const noteId = args.noteId;
        if (noteId && beforeSnapshot) {
          const afterNote = result?.data?.note;

          if (beforeSnapshot && afterNote) {
            entitySnapshots.push({
              entityType: 'note',
              entityId: noteId,
              beforeSnapshot,
              afterSnapshot: afterNote,
            });

            // Build payload to restore previous state
            const restorePayload: Record<string, any> = {};
            if (beforeSnapshot.title !== undefined)
              restorePayload.title = beforeSnapshot.title;
            if (beforeSnapshot.content !== undefined)
              restorePayload.content = beforeSnapshot.content;
            if (beforeSnapshot.folderId !== undefined)
              restorePayload.folderId = beforeSnapshot.folderId;

            inverseOperations.push({
              operationType: 'update',
              endpoint: `/api/notes/${noteId}/`,
              method: 'PUT',
              payload: restorePayload,
              noteId,
            });
          }
        }
        break;
      }

      case 'create-folder': {
        // For create, inverse is delete
        const createdFolder = result?.data?.folder;
        if (createdFolder) {
          const folderId = createdFolder.id;
          entitySnapshots.push({
            entityType: 'folder',
            entityId: folderId,
            afterSnapshot: createdFolder,
          });
          inverseOperations.push({
            operationType: 'delete',
            endpoint: `/api/folders/${folderId}/`,
            method: 'DELETE',
          });
        }
        break;
      }

      case 'delete-note': {
        // For delete, inverse is restore from snapshot
        // This would require storing the deleted note before deletion
        // For now, we mark it as a delete operation that can't be directly inverted
        const noteId = args.noteId;
        if (noteId) {
          entitySnapshots.push({
            entityType: 'note',
            entityId: noteId,
          });
          // Note: This is a limitation - we can't restore a deleted note without the snapshot
          // The action history should store the snapshot before deletion
        }
        break;
      }

      case 'delete-folder': {
        // Similar limitation as delete-note
        const folderId = args.folderId;
        if (folderId) {
          entitySnapshots.push({
            entityType: 'folder',
            entityId: folderId,
          });
        }
        break;
      }
    }
  } catch (error) {
    logger.warn(
      'Failed to build complete inverse operations',
      { toolName, error: error instanceof Error ? error.message : String(error) }
    );
  }

  return { entitySnapshots, inverseOperations };
}

// ---------------------------
// Tool Executor with Context
// ---------------------------
// Helper: Capture pre-execution snapshots for update operations
// ---------------------------
async function captureBeforeSnapshot(
  toolName: string,
  args: Record<string, any>,
  token: string | null
): Promise<any> {
  try {
    if (toolName === 'update-note' && args.noteId && token) {
      const noteResponse = await getNoteById(args.noteId, token);
      return noteResponse?.data?.note;
    }
    if (toolName === 'update-folder' && args.folderId && token) {
      const folderResponse = await getFolderById(args.folderId, token);
      return folderResponse?.data?.folder;
    }
  } catch (error) {
    logger.warn(
      `Failed to capture before snapshot for ${toolName}`,
      { error: error instanceof Error ? error.message : String(error) }
    );
  }
  return null;
}

// ---------------------------
/**
 * Execute a tool with the given name and arguments
 * Logs modifying actions to action history for revert functionality
 */
export async function executeToolWithLogging(
  name: string,
  args: any,
  token: string | null,
  context?: ToolExecutionContext
): Promise<any> {
  const implementation = toolImplementations[name];

  if (!implementation) {
    const error = new Error(`Tool not found: ${name}`);
    logger.warn(`Unknown tool requested: ${name}`);
    throw error;
  }

  try {
    logger.debug(`Executing tool: ${name}`, { toolName: name });

    // Capture before snapshot for update operations BEFORE execution
    let beforeSnapshot: any = null;
    if (isModifyingTool(name) && context) {
      beforeSnapshot = await captureBeforeSnapshot(name, args, token);
    }

    // Inject token automatically
    const argsWithToken = { ...args, token };
    const result = await implementation(argsWithToken);

    // Log modifying actions to action history
    if (isModifyingTool(name) && context) {
      try {
        const { entitySnapshots, inverseOperations } =
          await buildInverseOperations(name, args, result, token, beforeSnapshot);

        await ActionHistoryService.logAction(
          context.requestId,
          context.userId,
          name,
          args,
          result,
          entitySnapshots,
          inverseOperations
        );

        logger.debug(`Logged action to history`, {
          toolName: name,
          requestId: context.requestId,
          userId: context.userId,
        });
      } catch (logError) {
        logger.warn(
          `Failed to log action to history`,
          { toolName: name, requestId: context?.requestId, error: logError instanceof Error ? logError.message : String(logError) }
        );
        // Don't fail the tool execution if logging fails
      }
    }

    logger.debug(`Tool executed successfully: ${name}`, { toolName: name });
    return result;
  } catch (error) {
    logger.error(
      `Tool execution failed: ${name}`,
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
}

/**
 * Legacy executeTool - for backward compatibility
 */
export async function executeTool(
  name: string,
  args: any,
  token: string | null
): Promise<any> {
  return executeToolWithLogging(name, args, token);
}

/**
 * Check if a tool is available
 */
export function isToolAvailable(toolName: string): boolean {
  return toolName in toolImplementations;
}

/**
 * Get all available tool names
 */
export function getAvailableTools(): string[] {
  return Object.keys(toolImplementations);
}
