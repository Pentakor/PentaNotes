import { Router } from 'express';
import {
//   createTag,
//   getTags,
  getTagById,
  deleteTag,
} from '../controllers/tag.controller';
import { validate } from '../middleware/validation';
import {
  createTagSchema,
  getTagSchema,
  deleteTagSchema,
} from '../validators/tag.validator';
import { authenticate } from '../middleware/auth';

const router = Router();

// All note routes require authentication
router.use(authenticate);

// router.post('/', validate(createTagSchema), createTag);
// router.get('/', getTags);
router.get('/:id', validate(getTagSchema), getTagById);
router.delete('/:id', validate(deleteTagSchema), deleteTag);

export default router;