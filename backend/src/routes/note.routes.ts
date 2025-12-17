import { Router } from 'express';
import {
  createNote,
  getNotes,
  getNoteById,
  updateNote,
  deleteNote,
  getNoteNames,
} from '../controllers/note.controller';
import { validate } from '../middleware/validation';
import {
  createNoteSchema,
  updateNoteSchema,
  getNoteSchema,
  deleteNoteSchema,
} from '../validators/note.validator';
import { authenticate } from '../middleware/auth';

const router = Router();

// All note routes require authentication
router.use(authenticate);

router.post('/', validate(createNoteSchema), createNote);
router.get('/names', getNoteNames);
router.get('/', getNotes);
router.get('/:id', validate(getNoteSchema), getNoteById);
router.put('/:id', validate(updateNoteSchema), updateNote);
router.delete('/:id', validate(deleteNoteSchema), deleteNote);

export default router;