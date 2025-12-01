import { z } from 'zod';

export const createNoteSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
    content: z.string().default(''),
    folderId: z.number().optional(),
  }),
});

export const updateNoteSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid note ID'),
  }),
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
    content: z.string().optional(),
    folderId: z.number().optional(),
  }),
});

export const getNoteSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid note ID'),
  }),
});

export const deleteNoteSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid note ID'),
  }),
});