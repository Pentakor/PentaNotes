import { z } from 'zod';

export const createNoteSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
    content: z.string().default(''),
    folderId: z.preprocess(
      (val) => {
        if (val === null || val === undefined) return val;
        if (typeof val === 'string') return parseInt(val, 10);
        return val;
      },
      z.number().nullable()
    ).optional(),
  }),
});

export const updateNoteSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid note ID'),
  }),
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
    content: z.string().optional(),
    folderId: z.preprocess(
      (val) => {
        if (val === null || val === undefined || val === 'ALL Notes') return val;
        if (typeof val === 'string') return parseInt(val, 10);
        return val;
      },
      z.union([z.number(), z.literal('ALL Notes'), z.null()]).nullable()
    ).optional(),
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