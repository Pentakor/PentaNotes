import { Content } from '../types/content';
import { executeToolWithLogging, ToolExecutionContext } from './toolExecutor';
import { aiClientFactory } from './aiClient';
import { toolRegistry } from './toolRegistry';
import { promptLoader } from './promptLoader';
import { logger } from './logger';
import { ConversationHistoryService } from '../database/conversationHistoryModel';
import { ActionHistoryService } from '../database/actionHistoryModel';
import { v4 as uuidv4 } from 'uuid';

// ---------------------------
// AI Generation Loop
// ---------------------------

/**
 * Track which entities were changed by tools and return request ID
 */
export interface AIResponseWithChanges {
  response: string;
  changed: string[];
  requestId: string;
  actionCount: number;
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
  // Generate unique request ID for this AI call
  const requestId = uuidv4();
  
  const ai = aiClientFactory.getClient();
  const model = aiClientFactory.getModelName();
  const tools = toolRegistry.toSDKFormat();
  const baseSystemPrompt = promptLoader.loadSystemPrompt();
  const systemPrompt = ragContext ? `${baseSystemPrompt}${ragContext}` : baseSystemPrompt;
  const changedEntities = new Set<string>(); // Track changed entities

  logger.debug('Starting AI generation loop', {
    requestId,
    userId,
    contentCount: contents.length,
    toolCount: tools[0].functionDeclarations.length,
    hasRagContext: !!ragContext,
  });

  try {
    // Create action history record for this request
    await ActionHistoryService.createRequest(requestId, userId);

    // Create execution context for tool logging
    const executionContext: ToolExecutionContext = {
      requestId,
      userId,
    };

    let loopCount = 0;
    const MAX_LOOPS = 10; // Prevent infinite loops

    while (loopCount < MAX_LOOPS) {
      loopCount++;
      logger.debug(`AI generation loop iteration ${loopCount}`, { requestId });

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

        logger.info(`AI calling tool: ${name}`, { toolName: name, requestId, userId });

        // Track if this tool modifies data
        const changedEntity = getChangedEntityFromTool(name);
        if (changedEntity) {
          changedEntities.add(changedEntity);
        }

        // Execute the tool with logging context
        let toolResponse: any;
        try {
          toolResponse = await executeToolWithLogging(name, args, token, executionContext);
        } catch (error) {
          logger.error(
            `Tool execution error for ${name}`,
            error instanceof Error ? error : new Error(String(error)),
            { requestId, userId }
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

        logger.debug(`Tool response added to conversation`, { toolName: name, requestId });
      } else {
        // No more function calls, return final response with changes tracked
        const response = result.text || 'No response generated';
        const changed = Array.from(changedEntities);
        logger.info(`AI generation completed`, {
          requestId,
          userId,
          responseLength: response.length,
          loopCount,
          changedEntities: changed,
        });
        return {
          response,
          changed,
          requestId,
          actionCount: changedEntities.size,
        };
      }
    }

    // Loop limit reached
    logger.warn(
      `AI generation loop hit maximum iterations (${MAX_LOOPS})`,
      { requestId, userId }
    );
    throw new Error('AI generation loop exceeded maximum iterations');
  } catch (error) {
    // Mark the action history as failed
    try {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      await ActionHistoryService.markAsFailed(requestId, userId, errorMessage);
    } catch (markError) {
      logger.warn(
        'Failed to mark action history as failed',
        { requestId, userId, error: markError instanceof Error ? markError.message : String(markError) }
      );
    }
    throw error;
  }
}
