import { Request, Response } from 'express';
import {
  createFolderService,
  deleteFolderService,
  getFolderByIdService,
  getFoldersService,
  updateFolderService,
} from '../services/folder.service';

export const createFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title } = req.body;
    const userId = req.user?.id;

    const result = await createFolderService(userId!, title);

    // Handle duplicate title error
    if (result.error === 'DUPLICATE_TITLE') {
      res.status(409).json({
        success: false,
        message: 'A folder with this title already exists',
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      data: { folder: result.folder },
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

    const folders = await getFoldersService(userId!);

    res.status(200).json({
      success: true,
      data: { folders },
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

    const folder = await getFolderByIdService(userId!, parseInt(id));

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
      message: 'Error fetching tag',
    });
  }
};

export const updateFolder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user?.id;

    const result = await updateFolderService(userId!, parseInt(id), { title });

    if (!result) {
      res.status(404).json({
        success: false,
        message: 'Folder not found',
      });
      return;
    }

    // Handle duplicate title error
    if (result.error === 'DUPLICATE_TITLE') {
      res.status(409).json({
        success: false,
        message: 'A folder with this title already exists',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Folder updated successfully',
      data: { folder: result.folder },
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
    const folderId = parseInt(req.params.id);
    const userId = req.user?.id;

    if (isNaN(folderId)) {
      res.status(400).json({ success: false, message: 'Invalid folder ID' });
      return;
    }

    const deleted = await deleteFolderService(userId!, folderId);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Folder not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Folder and all related notes deleted successfully',
    });
  } catch (error) {
    console.error('Delete folder error:', error);
    res.status(500).json({ success: false, message: 'Error deleting folder' });
  }
};