import { Tag, NoteTag } from '../models';

export const getTagsService = async (userId: number) => {
  const tags = await Tag.findAll({
    where: { userId },
  });

  return tags;
};

export const getTagByIdService = async (userId: number, id: number) => {
  const tag = await Tag.findOne({
    where: { id, userId },
  });

  return tag;
};

export const deleteTagService = async (userId: number, id: number) => {
  const tag = await Tag.findOne({
    where: { id, userId },
  });

  if (!tag) {
    return { notFound: true, inUse: false };
  }

  const linkedNotesCount = await NoteTag.count({
    where: { tagId: tag.id },
  });

  if (linkedNotesCount > 0) {
    return { notFound: false, inUse: true };
  }

  await tag.destroy();

  return { notFound: false, inUse: false };
};


