import { Router, Request, Response } from 'express';
import { McpRequestBody, mcpSchema } from '../schemas/mcpSchema';
import { validate } from '../middleware/validation';
import { extractBearerToken } from '../helpers/tokenextraction';
import { getConversationHistory, addToConversationHistory } from '../helpers/conversationHistory';
import { generateAIResponse } from '../utils/aiGenerator';
import { sendSuccess, sendError } from '../utils/responseFormatter';
import { logger } from '../utils/logger';
import { Content } from '../types/content';

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
      const history = userId ? await getConversationHistory(userId) : [];

      // Build conversation contents
      const contents: Content[] = [
        ...history,
        {
          role: 'user',
          parts: [{ text: message }],
        },
      ];

      // Generate AI response with tool calling
      const aiResponse = await generateAIResponse(contents, token, userId);

      // Store in database
      await addToConversationHistory(userId, message, aiResponse);

      // Send success response
      return sendSuccess(
        res,
        aiResponse,
        'AI processed the request successfully.',
        200
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
