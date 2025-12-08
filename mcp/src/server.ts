// src/server.ts
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { McpRequestBody, mcpSchema } from './schemas/mcpSchema'; // Import schema and type
import { validate } from './middleware/validation'; // Import validation middleware

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// --- Helper function to extract the Bearer Token ---
const extractBearerToken = (req: Request): string | null => {
  const authHeader = req.headers['authorization'];
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // Return the token part
    return authHeader.split(' ')[1];
  }
  return null;
};

// --- The single POST /mcp route ---
app.post(
  '/mcp',
  validate(mcpSchema), // 👈 Apply Zod validation middleware here
  (req: Request<{}, {}, McpRequestBody>, res: Response) => {
    
    // At this point, req.body is guaranteed to be valid according to McpRequestBody type
    const token = extractBearerToken(req);
    const { message, userId } = req.body;

    // Log extracted data to console
    console.log(`Token Extracted: ${token ? token : 'NONE'}`);
    console.log(`User ID: ${userId}, Message: "${message}"`);

    // Send success response
    res.status(200).json({ 
      status: 'success', 
      message: 'Data validated and processed.',
      extractedToken: token, 
      data: {
          receivedMessage: message,
          receivedUserId: userId
      }
    });
  }
);

// --- Start the server ---
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});