import { Request, Response } from 'express';
import {
  createNoteService,
  deleteNoteService,
  getNoteByIdService,
  getNotesByFolderIdService,
  getNotesService,
  getTagsFromContent,
  getNotesByTagIdService,
  getNoteNamesService,
  updateNoteService,
} from '../services/note.service';

// CREATE NOTE
export const createNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, folderId } = req.body;
    const userId = req.user?.id;

    const result = await createNoteService(userId!, title, content, folderId);

    // Handle duplicate title error
    if (result.error === 'DUPLICATE_TITLE') {
      res.status(409).json({
        success: false,
        message: 'A note with this title already exists',
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: {
        note: {
          ...result.note!.dataValues,
          linkedNoteIds: result.linkedNoteIds,
          tagNames: result.tagNames,
        },
      },
    });
  } catch (error) {
    console.error('Create note error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating note',
    });
  }
};

// READ NOTES
export const getNotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const notesWithLinks = await getNotesService(userId!);

    res.status(200).json({
      success: true,
      data: { notes: notesWithLinks },
    });

  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notes',
    });
  }
};

export const getNotesByFolderId = async (req: Request, res: Response): Promise<void> => {
  try {
    const folderId = parseInt(req.params.id);
    if (isNaN(folderId)) {
      res.status(400).json({ success: false, message: 'Invalid folder ID' });
      return;
    }

    const userId = req.user?.id;
    const notesWithLinks = await getNotesByFolderIdService(userId!, folderId);

    res.status(200).json({
      success: true,
      data: { notes: notesWithLinks },
    });

  } catch (error) {
    console.error('Get notes by folder error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notes for folder',
    });
  }
};

export const getNoteById = async (req: Request, res: Response): Promise<void> => {
  try {
    const noteId = parseInt(req.params.id);
    if (isNaN(noteId)) {
      res.status(400).json({ success: false, message: 'Invalid note ID' });
      return;
    }

    const userId = req.user?.id;
    const noteWithLinks = await getNoteByIdService(userId!, noteId);

    if (!noteWithLinks) {
      res.status(404).json({ success: false, message: 'Note not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: { note: noteWithLinks },
    });
  } catch (error) {
    console.error('Get note error:', error);
    res.status(500).json({ success: false, message: 'Error fetching note' });
  }
};

// UPDATE NOTE
export const updateNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const noteId = parseInt(req.params.id);
    if (isNaN(noteId)) {
      res.status(400).json({ success: false, message: 'Invalid note ID' });
      return;
    }

    const { title, content, folderId } = req.body;
    const userId = req.user?.id;

    const result = await updateNoteService(userId!, noteId, { title, content, folderId });
    
    if (!result) {
      res.status(404).json({ success: false, message: 'Note not found' });
      return;
    }

    // Handle duplicate title error
    if (result.error === 'DUPLICATE_TITLE') {
      res.status(409).json({
        success: false,
        message: 'A note with this title already exists',
      });
      return;
    }

    const { note, linkedNoteIds, tagNames } = result;

    if (!note) {
      res.status(404).json({ success: false, message: 'Note not found' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: {
        note: {
          ...note.dataValues,
          linkedNoteIds,
          tagNames,
        },
      },
    });
  } catch (error) {
    console.error('Update note error:', error);
    res.status(500).json({ success: false, message: 'Error updating note' });
  }
};

// DELETE NOTE
export const deleteNote = async (req: Request, res: Response): Promise<void> => {
  try {
    const noteId = parseInt(req.params.id);
    if (isNaN(noteId)) {
      res.status(400).json({ success: false, message: 'Invalid note ID' });
      return;
    }

    const userId = req.user?.id;
    const deleted = await deleteNoteService(userId!, noteId);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Note not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({ success: false, message: 'Error deleting note' });
  }
};

export const getNotesByTagId = async (req: Request, res: Response): Promise<void> => {
  try {
    const tagId = parseInt(req.params.id);

    if (isNaN(tagId)) {
      res.status(400).json({ success: false, message: 'Invalid tag ID' });
      return;
    }

    const userId = req.user?.id;

    const notes = await getNotesByTagIdService(userId!, tagId);

    res.status(200).json({
      success: true,
      data: { notes },
    });

  } catch (error) {
    console.error('Get notes by tag error:', error);

    res.status(500).json({
      success: false,
      message: 'Error fetching notes for tag',
    });
  }
};

// GET NOTE NAMES
export const getNoteNames = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    const noteNames = await getNoteNamesService(userId!);

    res.status(200).json({
      success: true,
      data: { notes: noteNames },
    });

  } catch (error) {
    console.error('Get note names error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching note names',
    });
  }
};