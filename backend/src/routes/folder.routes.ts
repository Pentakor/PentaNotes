import { Router } from 'express';
import {
  createFolder,
  getFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
} from '../controllers/folder.controller';
import { getNotesByFolderId } from '../controllers/note.controller';
import { validate } from '../middleware/validation';
import {
  createFolderSchema,
  updateFolderSchema,
  getFolderSchema,
  deleteFolderSchema,
} from '../validators/folder.validator';
import { authenticate } from '../middleware/auth';

const router = Router();

// All Folder routes require authentication
router.use(authenticate);

router.post('/', validate(createFolderSchema), createFolder);
router.get('/', getFolders);
router.get('/:id', validate(getFolderSchema), getFolderById);
router.get('/:id/notes', validate(getFolderSchema), getNotesByFolderId);
router.put('/:id', validate(updateFolderSchema), updateFolder);
router.delete('/:id', validate(deleteFolderSchema), deleteFolder);

export default router;