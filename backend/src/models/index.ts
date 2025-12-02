import User from './User';
import Folder from './Folder';
import Note from './Note';
import NoteLink from './NoteLink';
import Tag from './Tag';
import NoteTag from './NoteTag';



// Define associations
User.hasMany(Note, {
  foreignKey: 'userId',
  as: 'notes',
});

User.hasMany(Folder, {
  foreignKey: 'userId',
  as: 'folders',
});

User.hasMany(Tag, {
  foreignKey: 'userId',
  as: 'tags',
});

Folder.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Folder.hasMany(Note, {
  foreignKey: 'folderId',
  as: 'notes',
});

Note.belongsTo(Folder, {
  foreignKey: 'folderId',
  as: 'folder',
});

Note.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Note.belongsToMany(Note, {
    through: NoteLink,
    as: 'outboundLinks', // Alias to find notes this note links to
    foreignKey: 'sourceId', // The column in NoteLink that holds this note's ID
    otherKey: 'targetId', // The column in NoteLink that holds the linked note's ID
});


// 2. Define the relationship from Note to its Backlinks
Note.belongsToMany(Note, {
    through: NoteLink,
    as: 'backlinks', // Alias to find notes that link TO this note
    foreignKey: 'targetId', // The column in NoteLink that holds this note's ID
    otherKey: 'sourceId', // The column in NoteLink that holds the linking note's ID
});

Note.belongsToMany(Tag, {
  through: NoteTag,
  as: 'tags',
  foreignKey: 'noteId',
  otherKey: 'tagId',
});

Tag.belongsToMany(Note, {
  through: NoteTag,
  as: 'notes',
  foreignKey: 'tagId',
  otherKey: 'noteId',
});

// Direct associations for NoteTag to enable eager loading (include: { model: Tag, as: 'tag' })
NoteTag.belongsTo(Tag, {
  foreignKey: 'tagId',
  as: 'tag',
});

Tag.hasMany(NoteTag, {
  foreignKey: 'tagId',
  as: 'noteTags',
});

Tag.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});


export { User, Note, Folder, NoteLink, Tag, NoteTag };