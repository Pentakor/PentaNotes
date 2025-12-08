// src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodSchema } from 'zod';

// Generic function to create validation middleware
export const validate = (schema: ZodSchema) => 
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate the request body
      schema.parse(req.body);
      next(); // Proceed if validation is successful
    } catch (error) {
      if (error instanceof ZodError) {
        // Return a 400 Bad Request with detailed validation errors
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: error.issues.map(issue => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        });
      }
      // Handle other unexpected errors
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  };