import { Note, NoteLink, NoteTag, Tag } from '../models';
import sequelize from '../config/database';
import { Op } from 'sequelize';

// Internal helpers
const getLinkedNotes = async (content: string): Promise<number[]> => {
  const regex = /\[\[(.*?)\]\]/g;
  const linkedTitles: string[] = [];
  let match: RegExpExecArray | null;

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

export const getTagsFromContent = (content: string): string[] => {
  const regex = /#(\w+)/g;
  const tags: string[] = [];
  let match: RegExpExecArray | null;

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

  if (tagsToRemove.length > 0) {
    const tagIdsToRemove = tagsToRemove.map(name => existingTagMap.get(name)!);

    await NoteTag.destroy({
      where: { noteId, tagId: tagIdsToRemove },
      transaction,
    });

    await Tag.increment(
      { noteCount: -1 },
      {
        where: { id: tagIdsToRemove },
        transaction,
      }
    );

    await Tag.destroy({
      where: {
        id: tagIdsToRemove,
        noteCount: { [Op.lte]: 0 },
      },
      transaction,
    });
  }

  if (tagsToAdd.length > 0) {
    const existingTags = await Tag.findAll({
      where: { userId, name: tagsToAdd },
      attributes: ['id', 'name'],
      transaction,
    });

    const existingTagsMap = new Map(existingTags.map(t => [t.name, t.id]));
    const tagsToCreate = tagsToAdd.filter(name => !existingTagsMap.has(name));

    if (tagsToCreate.length > 0) {
      const createdTags = await Tag.bulkCreate(
        tagsToCreate.map(name => ({ userId, name, noteCount: 0 })),
        { transaction, returning: true }
      );
      createdTags.forEach(tag => existingTagsMap.set(tag.name, tag.id));
    }

    const allTagIds = tagsToAdd.map(name => existingTagsMap.get(name)!);

    await Tag.increment(
      { noteCount: 1 },
      {
        where: { id: allTagIds },
        transaction,
      }
    );

    await NoteTag.bulkCreate(
      allTagIds.map(tagId => ({ noteId, tagId })),
      { transaction, ignoreDuplicates: true }
    );
  }
};

export const cleanupTagsForNotes = async (noteIds: number[], transaction: any): Promise<void> => {
  if (!noteIds.length) return;

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

  for (const noteTag of noteTags as any[]) {
    const tagId = noteTag.tagId;
    const count = parseInt(noteTag.count);

    await Tag.increment(
      { noteCount: -count },
      {
        where: { id: tagId },
        transaction,
      }
    );
  }

  const tagIds = noteTags.map((nt: any) => nt.tagId);
  await Tag.destroy({
    where: {
      id: tagIds,
      noteCount: { [Op.lte]: 0 },
    },
    transaction,
  });
};

const attachLinkedNoteIds = async (notes: any[]) => {
  if (!notes.length) return notes;

  const noteIds = notes.map(n => n.id);

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

  const outgoingMap: Record<number, number[]> = {};
  const incomingMap: Record<number, number[]> = {};
  const tagMap: Record<number, string[]> = {};

  links.forEach((link: any) => {
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

export const createNoteService = async (
  userId: number,
  title: string,
  content: string | undefined,
  folderId: number | null | undefined
) => {
  const t = await sequelize.transaction();
  try {
    // Check if a note with the same title already exists for this user
    const existingNote = await Note.findOne({
      where: { userId, title },
      transaction: t,
    });

    if (existingNote) {
      await t.rollback();
      return {
        error: 'DUPLICATE_TITLE',
        note: null,
        linkedNoteIds: [],
        tagNames: [],
      };
    }

    const note = await Note.create(
      {
        userId,
        title,
        content: content || '',
        folderId: folderId || undefined,
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

    await syncNoteTags(note.id, userId, content || '', t);

    await t.commit();

    return {
      note,
      linkedNoteIds: linkedNotes,
      tagNames: getTagsFromContent(content || ''),
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const getNotesService = async (userId: number) => {
  const notes = await Note.findAll({
    where: { userId },
    order: [['updatedAt', 'DESC']],
  });

  const notesWithLinks = await attachLinkedNoteIds(notes);
  return notesWithLinks;
};

export const getNoteNamesService = async (userId: number) => {
  const notes = await Note.findAll({
    where: { userId },
    attributes: ['id', 'title'],
    order: [['title', 'ASC']],
    raw: true,
  });

  return notes;
};

export const getNotesByFolderIdService = async (userId: number, folderId: number) => {
  const notes = await Note.findAll({
    where: { folderId, userId },
    order: [['updatedAt', 'DESC']],
  });

  const notesWithLinks = await attachLinkedNoteIds(notes);
  return notesWithLinks;
};

export const getNoteByIdService = async (userId: number, noteId: number) => {
  const note = await Note.findOne({ where: { id: noteId, userId } });
  if (!note) return null;

  const [noteWithLinks] = await attachLinkedNoteIds([note]);
  return noteWithLinks;
};

export const updateNoteService = async (
  userId: number,
  noteId: number,
  updates: { title?: string; content?: string; folderId?: number | null }
) => {
  const t = await sequelize.transaction();
  try {
    const note = await Note.findOne({ where: { id: noteId, userId }, transaction: t });
    if (!note) {
      await t.rollback();
      return null;
    }

    const { title, content, folderId } = updates;

    // Check if title is being updated and if it conflicts with another note
    // Check if title is being updated and if it conflicts with another note
    if (title !== undefined && title !== note.title) {
      const existingNote = await Note.findOne({
        where: {
          userId,
          title,
          id: { [Op.ne]: noteId }, // Exclude current note from check
        },
        transaction: t,
      });

      if (existingNote) {
        await t.rollback();
        return {
          error: 'DUPLICATE_TITLE',
          note: null,
          linkedNoteIds: [],
          tagNames: [],
        };
      }

      note.title = title;
    }

    if (folderId !== undefined) note.folderId = folderId ?? undefined;
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

      const idsToRemove = existingIds.filter((id: number) => !newLinkedNotes.includes(id));
      const idsToAdd = newLinkedNotes.filter((id: number) => !existingIds.includes(id));

      if (idsToRemove.length) {
        await NoteLink.destroy({
          where: { sourceId: note.id, targetId: idsToRemove },
          transaction: t
        });
      }

      if (idsToAdd.length) {
        await NoteLink.bulkCreate(
          idsToAdd.map(id => ({ sourceId: note.id, targetId: id })),
          { ignoreDuplicates: true, transaction: t }
        );
      }

      await syncNoteTags(note.id, userId, content, t);
    }

    await t.commit();

    return {
      note,
      linkedNoteIds: await getLinkedNotes(note.content),
      tagNames: getTagsFromContent(note.content),
    };
  } catch (error) {
    await t.rollback();
    throw error;
  }
};

export const getNotesByTagIdService = async (userId: number, tagId: number) => {
  const notes = await Note.findAll({
    where: { userId },
    include: [
      {
        model: Tag,
        as: 'tags',
        where: { id: tagId },
        through: { attributes: [] },
      },
    ],
    order: [['updatedAt', 'DESC']],
  });

  return notes;
};

export const deleteNoteService = async (userId: number, noteId: number) => {
  const t = await sequelize.transaction();
  try {
    const note = await Note.findOne({ where: { id: noteId, userId }, transaction: t });
    if (!note) {
      await t.rollback();
      return false;
    }

    await cleanupTagsForNotes([note.id], t);
    await NoteLink.destroy({ where: { sourceId: note.id }, transaction: t });
    await note.destroy({ transaction: t });

    await t.commit();
    return true;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};