import { Content } from '../types/content';
import {MAX_HISTORY_MESSAGES} from '../config/env';

// Store conversations in memory (userId -> conversation history)
const conversationStore = new Map<number, Content[]>();


export const getConversationHistory = (userId: number): Content[] => {
  return conversationStore.get(userId) || [];
};

export const addToConversationHistory = (
  userId: number,
  userMessage: string,
  aiResponse: string
): void => {
  const history = conversationStore.get(userId) || [];
  
  // Add user message
  history.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });
  
  // Add AI response
  history.push({
    role: 'model',
    parts: [{ text: aiResponse }]
  });
  
  // Keep only last N pairs (N*2 messages since each pair = user + model)
  const maxMessages = MAX_HISTORY_MESSAGES * 2;
  if (history.length > maxMessages) {
    history.splice(0, history.length - maxMessages);
  }
  
  conversationStore.set(userId, history);
};

export const clearConversationHistory = (userId: number): void => {
  conversationStore.delete(userId);
};