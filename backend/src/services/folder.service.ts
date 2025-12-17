import { Folder, Note, NoteLink } from '../models';
import sequelize from '../config/database';
import { cleanupTagsForNotes } from './note.service';
import { Op } from 'sequelize';

export const createFolderService = async (userId: number, title: string) => {
  // Prevent creating a folder with the reserved name 'ALL Notes'
  if (title === 'ALL Notes') {
    return {
      error: 'RESERVED_TITLE',
      folder: null,
    };
  }

  // Check if a folder with the same title already exists for this user
  const existingFolder = await Folder.findOne({
    where: { userId, title },
  });

  if (existingFolder) {
    return {
      error: 'DUPLICATE_TITLE',
      folder: null,
    };
  }

  const folder = await Folder.create({
    userId,
    title,
  });

  return { folder };
};

export const getFoldersService = async (userId: number) => {
  const folders = await Folder.findAll({
    where: { userId },
    order: [['updatedAt', 'DESC']],
  });

  return folders;
};

export const getFolderByIdService = async (userId: number, id: number) => {
  const folder = await Folder.findOne({
    where: { id, userId },
  });

  return folder;
};

export const updateFolderService = async (
  userId: number,
  id: number,
  updates: { title?: string },
) => {
  const folder = await Folder.findOne({
    where: { id, userId },
  });

  if (!folder) {
    return null;
  }

  const { title } = updates;

  // Check if title is being updated and if it conflicts with another folder
  if (title !== undefined && title !== folder.title) {
    // Prevent updating folder to the reserved name 'ALL Notes'
    if (title === 'ALL Notes') {
      return {
        error: 'RESERVED_TITLE',
        folder: null,
      };
    }

    const existingFolder = await Folder.findOne({
      where: {
        userId,
        title,
        id: { [Op.ne]: id }, // Exclude current folder from check
      },
    });

    if (existingFolder) {
      return {
        error: 'DUPLICATE_TITLE',
        folder: null,
      };
    }

    folder.title = title;
  }

  await folder.save();

  return { folder };
};

export const deleteFolderService = async (userId: number, folderId: number) => {
  const t = await sequelize.transaction();
  try {
    const folder = await Folder.findOne({ where: { id: folderId, userId }, transaction: t });
    if (!folder) {
      await t.rollback();
      return false;
    }

    const notes = await Note.findAll({
      where: { folderId: folder.id },
      attributes: ['id'],
      raw: true,
      transaction: t,
    });
    const noteIds = notes.map(n => n.id);

    if (noteIds.length) {
      await cleanupTagsForNotes(noteIds, t);

      await NoteLink.destroy({ where: { sourceId: noteIds }, transaction: t });

      await Note.destroy({ where: { id: noteIds }, transaction: t });
    }

    await folder.destroy({ transaction: t });

    await t.commit();

    return true;
  } catch (error) {
    await t.rollback();
    throw error;
  }
};