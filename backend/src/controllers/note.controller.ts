import { Request, Response } from 'express';
import { Note } from '../models';

export const createNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content } = req.body;
    const userId = req.user?.id;

    const note = await Note.create({
      userId: userId!,
      title,
      content: content || '',
    });

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: { note },
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating note',
    });
  }
};

export const getNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const notes = await Note.findAll({
      where: { userId },
      order: [['updatedAt', 'DESC']],
    });

    res.status(200).json({
      success: true,
      data: { notes },
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notes',
    });
  }
};

export const getNoteById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const note = await Note.findOne({
      where: { id: parseInt(id), userId },
    });

    if (!note) {
      res.status(404).json({
        success: false,
        message: 'Note not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { note },
    });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching note',
    });
  }
};

export const updateNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user?.id;

    const note = await Note.findOne({
      where: { id: parseInt(id), userId },
    });

    if (!note) {
      res.status(404).json({
        success: false,
        message: 'Note not found',
      });
      return;
    }

    // Update only provided fields
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;

    await note.save();

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: { note },
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating note',
    });
  }
};

export const deleteNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const note = await Note.findOne({
      where: { id: parseInt(id), userId },
    });

    if (!note) {
      res.status(404).json({
        success: false,
        message: 'Note not found',
      });
      return;
    }

    await note.destroy();

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting note',
    });
  }
};