import { Request, Response } from 'express';
import { Folder } from '../models';

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

    await folder.destroy();

    res.status(200).json({
      success: true,
      message: 'Folder deleted successfully',
    });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting folder',
    });
  }
};