import { Content } from '../types/content';
import { getConversationHistory } from '../helpers/conversationHistory';
import { generateAIResponse } from '../utils/aiGenerator';
import { logger } from '../utils/logger';

// ---------------------------
// Main AI Entry Point (kept for backward compatibility)
// ---------------------------
/**
 * @deprecated Use generateAIResponse from utils/aiGenerator.ts instead
 */
export async function runAI({
  userMessage,
  token,
  userId,
}: {
  userMessage: string;
  token: string | null;
  userId: number;
}): Promise<string> {
  logger.debug('runAI called (deprecated)', { userId });

  const history = userId ? await getConversationHistory(userId) : [];

  const contents: Content[] = [
    ...history,
    {
      role: 'user',
      parts: [{ text: userMessage }],
    },
  ];

  return generateAIResponse(contents, token, userId);
}