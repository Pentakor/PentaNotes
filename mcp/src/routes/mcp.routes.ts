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
import { getNoteNames, getFolders, getTags } from '../tools/backendapi';

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

      // Fetch context for RAG (notes, folders, tags)
      let ragContext = '';
      if (token) {
        try {
          // Fetch note names
          const notesResponse = await getNoteNames(token);
          if (notesResponse.success && notesResponse.data?.notes) {
            const noteList = notesResponse.data.notes
              .map((note: any) => `- ${note.title} (ID: ${note.id})`)
              .join('\n');
            ragContext += `\n\nUSER'S EXISTING NOTES:\n${noteList}`;
            logger.debug('Fetched note names for RAG context', { userId, noteCount: notesResponse.data.notes.length });
          }

          // Fetch folders
          const foldersResponse = await getFolders(token);
          if (foldersResponse.success && foldersResponse.data?.folders) {
            const folderList = foldersResponse.data.folders
              .map((folder: any) => `- ${folder.title} (ID: ${folder.id})`)
              .join('\n');
            ragContext += `\n\nUSER'S EXISTING FOLDERS:\n${folderList}`;
            logger.debug('Fetched folders for RAG context', { userId, folderCount: foldersResponse.data.folders.length });
          }

          // Fetch tags
          const tagsResponse = await getTags(token);
          if (tagsResponse.success && tagsResponse.data?.tags) {
            const tagList = tagsResponse.data.tags
              .map((tag: any) => `- ${tag.name}`)
              .join('\n');
            ragContext += `\n\nUSER'S EXISTING TAGS:\n${tagList}`;
            logger.debug('Fetched tags for RAG context', { userId, tagCount: tagsResponse.data.tags.length });
          }
        } catch (error) {
          logger.warn('Failed to fetch RAG context', { 
            userId, 
            error: error instanceof Error ? error.message : String(error) 
          });
        }
      }

      // Build conversation contents
      const contents: Content[] = [
        ...history,
        {
          role: 'user',
          parts: [{ text: message }],
        },
      ];

      // Generate AI response with tool calling
      const { response, changed } = await generateAIResponse(contents, token, userId, ragContext);

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
