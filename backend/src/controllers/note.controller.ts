import { Request, Response } from 'express';
import { Note, NoteLink, NoteTag, Tag } from '../models';
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

const getTagsFromContent = (content: string): string[] => {
  const regex = /#(\w+)/g;
  const tags: string[] = [];
  let match;

  while ((match = regex.exec(content)) !== null) {
    tags.push(match[1].toLowerCase());
  }

  return Array.from(new Set(tags));
};

const syncNoteTags = async (
  noteId: number,
  userId: number,
  content: string,
  transaction: any
): Promise<void> => {
  const newTagNames = getTagsFromContent(content);

  // Get existing tags for this note with tag details
  const existingNoteTags = await NoteTag.findAll({
    where: { noteId },
    include: [
      {
        model: Tag,
        as: 'tag',
        attributes: ['id', 'name'],
        required: true,
      },
    ],
    transaction,
  });

  const existingTagMap = new Map(
    existingNoteTags.map((nt: any) => [nt.tag.name, nt.tag.id])
  );
  const existingTagNames = Array.from(existingTagMap.keys());

  const tagsToAdd = newTagNames.filter(name => !existingTagNames.includes(name));
  const tagsToRemove = existingTagNames.filter(name => !newTagNames.includes(name));

  // OPTIMIZED: Remove old tags in bulk
  if (tagsToRemove.length > 0) {
    const tagIdsToRemove = tagsToRemove.map(name => existingTagMap.get(name)!);

    // Bulk delete NoteTag associations
    await NoteTag.destroy({
      where: { noteId, tagId: tagIdsToRemove },
      transaction,
    });

    // Bulk decrement noteCount using Sequelize increment (with negative value)
    await Tag.increment(
      { noteCount: -1 },
      {
        where: { id: tagIdsToRemove },
        transaction,
      }
    );

    // Delete tags with 0 count
    await Tag.destroy({
      where: {
        id: tagIdsToRemove,
        noteCount: { [Op.lte]: 0 },
      },
      transaction,
    });
  }

  // OPTIMIZED: Add new tags in bulk
  if (tagsToAdd.length > 0) {
    // Find existing tags that user already has
    const existingTags = await Tag.findAll({
      where: { userId, name: tagsToAdd },
      attributes: ['id', 'name'],
      transaction,
    });

    const existingTagsMap = new Map(existingTags.map(t => [t.name, t.id]));
    const tagsToCreate = tagsToAdd.filter(name => !existingTagsMap.has(name));

    // Bulk create new tags
    if (tagsToCreate.length > 0) {
      const createdTags = await Tag.bulkCreate(
        tagsToCreate.map(name => ({ userId, name, noteCount: 0 })),
        { transaction, returning: true }
      );
      createdTags.forEach(tag => existingTagsMap.set(tag.name, tag.id));
    }

    const allTagIds = tagsToAdd.map(name => existingTagsMap.get(name)!);

    // Bulk increment noteCount
    await Tag.increment(
      { noteCount: 1 },
      {
        where: { id: allTagIds },
        transaction,
      }
    );

    // Bulk create NoteTag associations
    await NoteTag.bulkCreate(
      allTagIds.map(tagId => ({ noteId, tagId })),
      { transaction, ignoreDuplicates: true }
    );
  }
};

// OPTIMIZED: Helper function to clean up tags when deleting notes
const cleanupTagsForNotes = async (noteIds: number[], transaction: any): Promise<void> => {
  if (!noteIds.length) return;

  // Get all tag IDs and their counts in ONE query using GROUP BY
  const noteTags = await NoteTag.findAll({
    where: { noteId: noteIds },
    attributes: [
      'tagId',
      [sequelize.fn('COUNT', sequelize.col('tagId')), 'count'],
    ],
    group: ['tagId'],
    raw: true,
    transaction,
  });

  if (!noteTags.length) return;

  // Process each unique tag with its count
  for (const noteTag of noteTags as any[]) {
    const tagId = noteTag.tagId;
    const count = parseInt(noteTag.count);

    // Decrement by the specific count
    await Tag.increment(
      { noteCount: -count },
      {
        where: { id: tagId },
        transaction,
      }
    );
  }

  // Bulk delete tags with 0 or negative count
  const tagIds = noteTags.map((nt: any) => nt.tagId);
  await Tag.destroy({
    where: {
      id: tagIds,
      noteCount: { [Op.lte]: 0 },
    },
    transaction,
  });
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

    await syncNoteTags(note.id, userId!, content || '', t);

    await t.commit();

    res.status(201).json({
      success: true,
      message: 'Note created successfully',
      data: {
        note: {
          ...note.dataValues,
          linkedNoteIds: linkedNotes,
          tagNames: getTagsFromContent(content || ''),
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

      await syncNoteTags(note.id, userId!, content, t);
    }

    await t.commit();

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: {
        note: {
          ...note.dataValues,
          linkedNoteIds: await getLinkedNotes(note.content),
          tagNames: getTagsFromContent(note.content),
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

    await cleanupTagsForNotes([note.id], t);
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

// OPTIMIZED: Attach linked notes and tags with minimal queries
const attachLinkedNoteIds = async (notes: any[]) => {
  if (!notes.length) return notes;

  const noteIds = notes.map(n => n.id);

  // Single query for all links
  const links = await NoteLink.findAll({
    where: {
      [Op.or]: [
        { sourceId: noteIds },
        { targetId: noteIds },
      ],
    },
    attributes: ['sourceId', 'targetId'],
    raw: true,
  });

  // Single query for all tags using Sequelize include
  const noteTags = await NoteTag.findAll({
    where: { noteId: noteIds },
    attributes: ['noteId'],
    include: [
      {
        model: Tag,
        as: 'tag',
        attributes: ['name'],
        required: true,
      },
    ],
  });

  // Build maps
  const outgoingMap: Record<number, number[]> = {};
  const incomingMap: Record<number, number[]> = {};
  const tagMap: Record<number, string[]> = {};

  links.forEach(link => {
    if (noteIds.includes(link.sourceId)) {
      if (!outgoingMap[link.sourceId]) outgoingMap[link.sourceId] = [];
      outgoingMap[link.sourceId].push(link.targetId);
    }

    if (noteIds.includes(link.targetId)) {
      if (!incomingMap[link.targetId]) incomingMap[link.targetId] = [];
      incomingMap[link.targetId].push(link.sourceId);
    }
  });

  noteTags.forEach((nt: any) => {
    if (!tagMap[nt.noteId]) tagMap[nt.noteId] = [];
    tagMap[nt.noteId].push(nt.tag.name);
  });

  return notes.map(n => ({
    ...n.dataValues,
    linkedNoteIds: outgoingMap[n.id] || [],
    backlinkNoteIds: incomingMap[n.id] || [],
    tagNames: tagMap[n.id] || [],
  }));
};