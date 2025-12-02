import { Request, Response } from 'express';
import { Note, Tag, NoteTag } from '../models';
import sequelize from '../config/database';

// export const createTag = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const { name } = req.body;
//     const userId = req.user?.id;

//     const tag = await Tag.create({
//       userId: userId!,
//       name: name!
//     });

//     res.status(201).json({
//       success: true,
//       message: 'Tag created successfully',
//       data: { tag },
//     });
//   } catch (error) {
//     console.error('Create tag error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error creating tag',
//     });
//   }
// };

// export const getTags = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const userId = req.user?.id;

//     const tags = await Tag.findAll({
//       where: { userId },
//     });

//     res.status(200).json({
//       success: true,
//       data: { tags },
//     });
//   } catch (error) {
//     console.error('Get tags error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Error tags notes',
//     });
//   }
// };

export const getTagById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const tag = await Tag.findOne({
      where: { id: parseInt(id), userId },
    });

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

    // Find the tag for this user
    const tag = await Tag.findOne({
      where: { id: parseInt(id), userId },
    });

    if (!tag) {
      res.status(404).json({
        success: false,
        message: 'Tag not found',
      });
      return;
    }

    // Check if there are any NoteTag entries using this tag
    const linkedNotesCount = await NoteTag.count({
      where: { tagId: tag.id },
    });

    if (linkedNotesCount > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete tag: it is used by one or more notes',
      });
      return;
    }

    // Safe to delete
    await tag.destroy();

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
