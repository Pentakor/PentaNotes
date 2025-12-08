import express, { Request, Response } from 'express';
import { PORT } from './config/env';
import { McpRequestBody, mcpSchema } from './schemas/mcpSchema';
import { validate } from './middleware/validation';
import { runAI } from './LLM/api';


const app = express();
app.use(express.json());

// --- Helper function to extract Bearer token ---
const extractBearerToken = (req: Request): string | null => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
};

// --- Adjusted POST /mcp route ---
app.post(
  '/mcp',
  validate(mcpSchema),
  async (req: Request<{}, {}, McpRequestBody>, res: Response) => {
    const token = extractBearerToken(req);
    const { message, userId } = req.body;

    //console.log(`Token Extracted: ${token ?? 'NONE'}`);
    console.log(`User ID: ${userId}, Message: "${message}"`);

    try {
      const aiResponse = await runAI({
        userMessage: message,
        token,
        userId,
      });

      res.status(200).json({
        status: 'success',
        message: 'AI processed the request successfully.',
        data: aiResponse,
      });
    } catch (error) {
      console.error('AI processing error:', error);
      res.status(500).json({
        status: 'error',
        message: 'Failed to process AI request',
        error: error instanceof Error ? error.message : error,
      });
    }
  }
);

app.listen(PORT, () => {
  
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
