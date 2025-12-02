import { Request, Response } from 'express';
import { Note, NoteLink } from '../models';
import sequelize from '../config/database';
import { Op } from 'sequelize';

const getLinkedNotes = async (content: string): Promise<number[]> => {
  const regex = /\[\[(.*?)\]\]/g;
  const linkedTitles: string[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    linkedTitles.push(match[1].trim());
  }

  if (!linkedTitles.length) return [];

  const linkedNotes = await Note.findAll({
    where: { title: linkedTitles },
    attributes: ['id'],
    raw: true,
  });

  return linkedNotes.map(n => n.id);
};

// CREATE NOTE
export const createNote = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const { title, content, folderId } = req.body;
    const userId = req.user?.id;

    const note = await Note.create(
      {
        userId: userId!,
        title,
        content: content || '',
        folderId: folderId || null,
      },
      { transaction: t }
    );

    const linkedNotes = Array.from(new Set(await getLinkedNotes(content || '')));
    if (linkedNotes.length) {
      await NoteLink.bulkCreate(
        linkedNotes.map(id => ({ sourceId: note.id, targetId: id })),
        { transaction: t, ignoreDuplicates: true }
      );
    }

    await t.commit();

    res.status(201).json({
    success: true,
    message: 'Note created successfully',
    data: { 
      note: { 
        ...note.dataValues,
        linkedNoteIds: linkedNotes
      } 
    },
  });
  } catch (error) {
    await t.rollback();
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

    const notes = await Note.findAll({
      where: { userId },
      order: [['updatedAt', 'DESC']],
    });

    const notesWithLinks = await attachLinkedNoteIds(notes);

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

    const notes = await Note.findAll({
      where: { folderId, userId },
      order: [['updatedAt', 'DESC']],
    });

    const notesWithLinks = await attachLinkedNoteIds(notes);

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
    const note = await Note.findOne({ where: { id: noteId, userId } });

    if (!note) {
      res.status(404).json({ success: false, message: 'Note not found' });
      return;
    }

    const [noteWithLinks] = await attachLinkedNoteIds([note]);

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
  const t = await sequelize.transaction();
  try {
    const noteId = parseInt(req.params.id);
    if (isNaN(noteId)) {
      res.status(400).json({ success: false, message: 'Invalid note ID' });
      return;
    }

    const { title, content, folderId } = req.body;
    const userId = req.user?.id;

    const note = await Note.findOne({ where: { id: noteId, userId }, transaction: t });
    if (!note) {
      res.status(404).json({ success: false, message: 'Note not found' });
      await t.rollback();
      return;
    }

    // Update fields
    if (title !== undefined) note.title = title;
    if (folderId !== undefined) note.folderId = folderId;
    if (content !== undefined) note.content = content;
    await note.save({ transaction: t });

    if (content !== undefined) {
      const newLinkedNotes = Array.from(new Set(await getLinkedNotes(content)));
      const existingLinks = await NoteLink.findAll({
        where: { sourceId: note.id },
        attributes: ['targetId'],
        raw: true,
        transaction: t,
      });
      const existingIds = existingLinks.map(link => link.targetId);

      const idsToRemove = existingIds.filter(id => !newLinkedNotes.includes(id));
      const idsToAdd = newLinkedNotes.filter(id => !existingIds.includes(id));

      if (idsToRemove.length) {
        await NoteLink.destroy({ where: { sourceId: note.id, targetId: idsToRemove }, transaction: t });
      }

      if (idsToAdd.length) {
        await NoteLink.bulkCreate(
          idsToAdd.map(id => ({ sourceId: note.id, targetId: id })),
          { ignoreDuplicates: true, transaction: t }
        );
      }
    }

    await t.commit();

    res.status(201).json({
    success: true,
    message: 'Note created successfully',
    data: { 
      note: { 
        ...note.dataValues,
        linkedNoteIds: await getLinkedNotes(note.content)
      } 
    },
  });
  } catch (error) {
    await t.rollback();
    console.error('Update note error:', error);
    res.status(500).json({ success: false, message: 'Error updating note' });
  }
};

// DELETE NOTE
export const deleteNote = async (req: Request, res: Response): Promise<void> => {
  const t = await sequelize.transaction();
  try {
    const noteId = parseInt(req.params.id);
    if (isNaN(noteId)) {
      res.status(400).json({ success: false, message: 'Invalid note ID' });
      return;
    }

    const userId = req.user?.id;
    const note = await Note.findOne({ where: { id: noteId, userId }, transaction: t });
    if (!note) {
      res.status(404).json({ success: false, message: 'Note not found' });
      await t.rollback();
      return;
    }

    // Delete associated links first
    await NoteLink.destroy({ where: { sourceId: note.id }, transaction: t });
    await note.destroy({ transaction: t });

    await t.commit();

    res.status(200).json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    await t.rollback();
    console.error('Delete note error:', error);
    res.status(500).json({ success: false, message: 'Error deleting note' });
  }
};

const attachLinkedNoteIds = async (notes: any[]) => {
  if (!notes.length) return notes;

  const noteIds = notes.map(n => n.id);

  // Fetch ALL links where current notes are either source OR target
  const links = await NoteLink.findAll({
    where: {
      [Op.or]: [
        { sourceId: noteIds }, // outgoing
        { targetId: noteIds }, // incoming (backlinks)
      ],
    },
    attributes: ['sourceId', 'targetId'],
    raw: true,
  });

  // Maps
  const outgoingMap: Record<number, number[]> = {};
  const incomingMap: Record<number, number[]> = {};

  links.forEach(link => {
    // Outgoing links (normal)
    if (noteIds.includes(link.sourceId)) {
      if (!outgoingMap[link.sourceId]) outgoingMap[link.sourceId] = [];
      outgoingMap[link.sourceId].push(link.targetId);
    }

    // Incoming links (backlinks)
    if (noteIds.includes(link.targetId)) {
      if (!incomingMap[link.targetId]) incomingMap[link.targetId] = [];
      incomingMap[link.targetId].push(link.sourceId);
    }
  });

  return notes.map(n => ({
    ...n.dataValues,
    linkedNoteIds: outgoingMap[n.id] || [],
    backlinkNoteIds: incomingMap[n.id] || [],
  }));
};

