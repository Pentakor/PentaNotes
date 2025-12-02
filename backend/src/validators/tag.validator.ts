import { z } from 'zod';

export const createTagSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(255, 'Name too long').regex(/^\S+$/, 'Name cannot contain spaces'),
  }),
});

export const getTagSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid Tag ID'),
  }),
});

export const deleteTagSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid Tag ID'),
  }),
});