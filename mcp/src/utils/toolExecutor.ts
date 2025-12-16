import {
  createNote,
  updateNote,
  getFolders,
  getTags,
  getNotes,
  createFolder,
} from '../tools/backendapi';
import { logger } from './logger';

// ---------------------------
// Tool Implementation Map
// ---------------------------
const toolImplementations: Record<string, Function> = {
  'create-note': async (args: any) => {
    const { title, content, token } = args;
    return createNote(title, content || '', token);
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
// Tool Executor
// ---------------------------
/**
 * Execute a tool with the given name and arguments
 */
export async function executeTool(
  name: string,
  args: any,
  token: string | null
): Promise<any> {
  const implementation = toolImplementations[name];

  if (!implementation) {
    const error = new Error(`Tool not found: ${name}`);
    logger.warn(`Unknown tool requested: ${name}`);
    throw error;
  }

  try {
    logger.debug(`Executing tool: ${name}`, { toolName: name });

    // Inject token automatically
    const argsWithToken = { ...args, token };
    const result = await implementation(argsWithToken);

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
