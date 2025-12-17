import { Request, Response } from 'express';
import {
  deleteTagService,
  getTagByIdService,
  getTagsService,
} from '../services/tag.service';

export const getTags = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const tags = await getTagsService(userId!);

    res.status(200).json({
      success: true,
      data: { tags },
    });
  } catch (error) {
    console.error('Get tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Error tags notes',
    });
  }
};

export const getTagById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const tag = await getTagByIdService(userId!, parseInt(id));

    if (!tag) {
      res.status(404).json({
        success: false,
        message: 'Tag not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { tag },
    });
  } catch (error) {
    console.error('Get tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tag',
    });
  }
};

export const deleteTag = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const result = await deleteTagService(userId!, parseInt(id));

    if (result.notFound) {
      res.status(404).json({
        success: false,
        message: 'Tag not found',
      });
      return;
    }

    if (result.inUse) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete tag: it is used by one or more notes',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Tag deleted successfully',
    });
  } catch (error) {
    console.error('Delete tag error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting tag',
    });
  }
};