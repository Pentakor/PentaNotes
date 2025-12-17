import fs from "fs";
import path from "path";
import { logger } from '../utils/logger';

// ---------------------------
// System Prompt Loader
// ---------------------------
class PromptLoader {
  private systemPrompt: string | null = null;

  /**
   * Load system prompt from file
   */
  loadSystemPrompt(): string {
    if (this.systemPrompt) {
      return this.systemPrompt;
    }

    try {
      const promptPath = path.resolve(__dirname, '../LLM/prompt.txt');
      this.systemPrompt = fs.readFileSync(promptPath, 'utf-8');
      logger.debug('System prompt loaded successfully');
      return this.systemPrompt;
    } catch (error) {
      logger.error(
        'Failed to load system prompt',
        error instanceof Error ? error : new Error(String(error))
      );
      throw new Error('System prompt not found');
    }
  }

  /**
   * Clear cached prompt (for testing)
   */
  clearCache(): void {
    this.systemPrompt = null;
  }
}

// Export singleton
export const promptLoader = new PromptLoader();
