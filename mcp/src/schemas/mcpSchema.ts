// src/schemas/mcpSchema.ts
import { z } from 'zod';

// Define the Zod schema for the request body
export const mcpSchema = z.object({
  
  // Customizing the error message for invalid type
  message: z.string({
    // Use 'message' instead of 'invalid_type_error'
    message: "Message must be a string", 
  }).min(1, "Message cannot be empty"),
  
  userId: z.number({
    // Use 'message' instead of 'invalid_type_error'
    message: "User ID must be a number",
  }).int("User ID must be an integer"), 
});

// Infer the TypeScript type from the schema for use in controllers
export type McpRequestBody = z.infer<typeof mcpSchema>;