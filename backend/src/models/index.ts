import User from './User';
import Folder from './Folder';
import Note from './Note';
import NoteLink from './NoteLink';


// Define associations
User.hasMany(Note, {
  foreignKey: 'userId',
  as: 'notes',
});

User.hasMany(Folder, {
  foreignKey: 'userId',
  as: 'folders',
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

export { User, Note, Folder, NoteLink };