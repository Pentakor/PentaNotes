import { GoogleGenAI } from "@google/genai";
import { GEMINI_API_KEY, MODEL } from '../config/env';
import { logger } from './logger';

// ---------------------------
// AI Client Factory
// ---------------------------
class AIClientFactory {
  private client: GoogleGenAI | null = null;

  /**
   * Get or create AI client
   */
  getClient(): GoogleGenAI {
    if (!this.client) {
      try {
        this.client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
        logger.debug('AI client initialized', { model: MODEL });
      } catch (error) {
        logger.error(
          'Failed to initialize AI client',
          error instanceof Error ? error : new Error(String(error))
        );
        throw new Error('Failed to initialize AI client');
      }
    }

    return this.client;
  }

  /**
   * Get the configured model name
   */
  getModelName(): string {
    return MODEL;
  }

  /**
   * Reset client (for testing)
   */
  reset(): void {
    this.client = null;
  }
}

// Export singleton
export const aiClientFactory = new AIClientFactory();
