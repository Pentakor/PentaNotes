import { Router, Request, Response } from 'express';
import { McpRequestBody, mcpSchema } from '../schemas/mcpSchema';
import { validate } from '../middleware/validation';
import { extractBearerToken } from '../helpers/tokenextraction';
import { ConversationHistoryService } from '../database/conversationHistoryModel';
import { generateAIResponse } from '../utils/aiGenerator';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import { logger } from '../utils/logger';
import { Content } from '../types/content';
import { MAX_HISTORY_MESSAGES } from '../config/env';

const router = Router();

/**
 * POST /mcp - Process AI request with tool calling
 */
router.post(
  '/',
  validate(mcpSchema),
  async (req: Request<{}, {}, McpRequestBody>, res: Response) => {
    const token = extractBearerToken(req);
    const { message, userId } = req.body;

    logger.info('Incoming AI request', { userId, messageLength: message.length });

    try {
      // Get conversation history from database
      const history = userId ? await ConversationHistoryService.getHistory(userId) : [];

      // Build conversation contents
      const contents: Content[] = [
        ...history,
        {
          role: 'user',
          parts: [{ text: message }],
        },
      ];

      // Generate AI response with tool calling
      const { response, changed } = await generateAIResponse(contents, token, userId);

      // Store in database
      if (userId) {
        await ConversationHistoryService.addToHistory(userId, message, response, MAX_HISTORY_MESSAGES);
      }

      // Send success response
      return sendSuccess(
        res,
        response,
        'AI processed the request successfully.',
        200,
        changed
      );
    } catch (error) {
      logger.error(
        'AI processing error',
        error instanceof Error ? error : new Error(String(error)),
        { userId }
      );

      return sendError(
        res,
        'Failed to process AI request',
        error instanceof Error ? error : new Error(String(error)),
        500
      );
    }
  }
);

export const mcpRouter = router;
