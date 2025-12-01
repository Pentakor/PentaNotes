import { Request, Response } from 'express';
import { Folder, Note, NoteLink } from '../models';
import sequelize from '../config/database';

export const createFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title } = req.body;
    const userId = req.user?.id;

    const folder = await Folder.create({
      userId: userId!,
      title
    });

    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      data: { folder },
    });
  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating folder',
    });
  }
};

export const getFolders = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const notes = await Folder.findAll({
      where: { userId },
      order: [['updatedAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: { notes },
    });
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notes',
    });
  }
};

export const getFolderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const folder = await Folder.findOne({
      where: { id: parseInt(id), userId },
    });

    if (!folder) {
      res.status(404).json({
        success: false,
        message: 'Folder not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { folder },
    });
  } catch (error) {
    console.error('Get folder error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching note',
    });
  }
};

export const updateFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user?.id;

    const folder = await Folder.findOne({
      where: { id: parseInt(id), userId },
    });

    if (!folder) {
      res.status(404).json({
        success: false,
        message: 'Folder not found',
      });
      return;
    }

    // Update only provided fields
    if (title !== undefined) folder.title = title;

    await folder.save();

    res.status(200).json({
      success: true,
      message: 'Folder updated successfully',
      data: { folder },
    });
  } catch (error) {
    console.error('Update folder error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating folder',
    });
  }
};

export const deleteFolder = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const folderId = parseInt(req.params.id);
    const userId = req.user?.id;

    if (isNaN(folderId)) {
      res.status(400).json({ success: false, message: 'Invalid folder ID' });
      return;
    }

    const folder = await Folder.findOne({ where: { id: folderId, userId }, transaction: t });
    if (!folder) {
      await t.rollback();
      res.status(404).json({ success: false, message: 'Folder not found' });
      return;
    }

    // Get all note IDs in this folder
    const notes = await Note.findAll({ where: { folderId: folder.id }, attributes: ['id'], raw: true, transaction: t });
    const noteIds = notes.map(n => n.id);

    if (noteIds.length) {
      // Delete all NoteLinks in bulk
      await NoteLink.destroy({ where: { sourceId: noteIds }, transaction: t });

      // Delete all Notes in bulk
      await Note.destroy({ where: { id: noteIds }, transaction: t });
    }

    // Delete the folder itself
    await folder.destroy({ transaction: t });

    await t.commit();

    res.status(200).json({
      success: true,
      message: 'Folder and all related notes deleted successfully',
    });
  } catch (error) {
    await t.rollback();
    console.error('Delete folder error:', error);
    res.status(500).json({ success: false, message: 'Error deleting folder' });
  }
};