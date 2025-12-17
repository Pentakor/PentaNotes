import { Content } from '../types/content';
import { executeTool } from './toolExecutor';
import { aiClientFactory } from './aiClient';
import { toolRegistry } from './toolRegistry';
import { promptLoader } from './promptLoader';
import { logger } from './logger';
import { ConversationHistoryService } from '../database/conversationHistoryModel';

// ---------------------------
// AI Generation Loop
// ---------------------------

/**
 * Track which entities were changed by tools
 */
export interface AIResponseWithChanges {
  response: string;
  changed: string[];
}

/**
 * Get changed entity type based on tool name
 */
function getChangedEntityFromTool(toolName: string): string | null {
  const toolToEntityMap: Record<string, string> = {
    'create-note': 'notes',
    'update-note': 'notes',
    'delete-note': 'notes',
    'create-folder': 'folders',
    'update-folder': 'folders',
    'delete-folder': 'folders',
  };
  return toolToEntityMap[toolName] || null;
}

/**
 * Run the AI generation loop with tool calling
 */
export async function generateAIResponse(
  contents: Content[],
  token: string | null,
  userId: number,
  ragContext: string = ''
): Promise<AIResponseWithChanges> {
  const ai = aiClientFactory.getClient();
  const model = aiClientFactory.getModelName();
  const tools = toolRegistry.toSDKFormat();
  const baseSystemPrompt = promptLoader.loadSystemPrompt();
  const systemPrompt = ragContext ? `${baseSystemPrompt}${ragContext}` : baseSystemPrompt;
  const changedEntities = new Set<string>(); // Track changed entities

  logger.debug('Starting AI generation loop', {
    userId,
    contentCount: contents.length,
    toolCount: tools[0].functionDeclarations.length,
    hasRagContext: !!ragContext,
  });

  let loopCount = 0;
  const MAX_LOOPS = 10; // Prevent infinite loops

  while (loopCount < MAX_LOOPS) {
    loopCount++;
    logger.debug(`AI generation loop iteration ${loopCount}`);

    const result = await ai.models.generateContent({
      model,
      contents,
      config: {
        tools,
        systemInstruction: systemPrompt,
      },
    });

    // Check if AI wants to call tools
    if (result.functionCalls && result.functionCalls.length > 0) {
      const functionCall = result.functionCalls[0];
      const { name, args = {} } = functionCall;

      if (!name) {
        throw new Error('Function call missing name');
      }

      logger.info(`AI calling tool: ${name}`, { toolName: name, userId });

      // Track if this tool modifies data
      const changedEntity = getChangedEntityFromTool(name);
      if (changedEntity) {
        changedEntities.add(changedEntity);
      }

      // Execute the tool
      let toolResponse: any;
      try {
        toolResponse = await executeTool(name, args, token);
      } catch (error) {
        logger.error(
          `Tool execution error for ${name}`,
          error instanceof Error ? error : new Error(String(error)),
          { userId }
        );
        throw error;
      }

      // Add function call to conversation
      contents.push({
        role: 'model',
        parts: [{ functionCall }],
      });

      // Add tool response to conversation
      contents.push({
        role: 'user',
        parts: [
          {
            functionResponse: {
              name,
              response: { result: toolResponse },
            },
          },
        ],
      });

      logger.debug(`Tool response added to conversation`, { toolName: name });
    } else {
      // No more function calls, return final response with changes tracked
      const response = result.text || 'No response generated';
      const changed = Array.from(changedEntities);
      logger.info(`AI generation completed`, {
        userId,
        responseLength: response.length,
        loopCount,
        changedEntities: changed,
      });
      return {
        response,
        changed,
      };
    }
  }

  // Loop limit reached
  logger.warn(
    `AI generation loop hit maximum iterations (${MAX_LOOPS})`,
    { userId }
  );
  throw new Error('AI generation loop exceeded maximum iterations');
}
