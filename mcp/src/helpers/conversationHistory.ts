import { Content } from '../types/content';
import { MAX_HISTORY_MESSAGES } from '../config/env';
import { ConversationHistoryService } from '../database/conversationHistoryModel';

/**
 * Get conversation history for a user
 * @deprecated Use ConversationHistoryService.getHistory() for new code
 */
export const getConversationHistory = async (userId: number): Promise<Content[]> => {
  return ConversationHistoryService.getHistory(userId);
};

/**
 * Add to conversation history
 * @deprecated Use ConversationHistoryService.addToHistory() for new code
 */
export const addToConversationHistory = async (
  userId: number,
  userMessage: string,
  aiResponse: string
): Promise<void> => {
  await ConversationHistoryService.addToHistory(userId, userMessage, aiResponse, MAX_HISTORY_MESSAGES);
};

/**
 * Clear conversation history for a user
 * @deprecated Use ConversationHistoryService.clearHistory() for new code
 */
export const clearConversationHistory = async (userId: number): Promise<void> => {
  await ConversationHistoryService.clearHistory(userId);
};