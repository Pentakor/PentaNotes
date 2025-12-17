import { z } from 'zod';

export const createFolderSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title too long').refine(
      (title) => title !== 'ALL Notes',
      'Cannot use reserved folder name "ALL Notes"'
    ),
  }),
});

export const updateFolderSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid Folder ID'),
  }),
  body: z.object({
    title: z.string().min(1, 'Title is required').max(255, 'Title too long').refine(
      (title) => title !== 'ALL Notes',
      'Cannot use reserved folder name "ALL Notes"'
    ).optional(),
  }),
});

export const getFolderSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid Folder ID'),
  }),
});

export const deleteFolderSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid Folder ID'),
  }),
});