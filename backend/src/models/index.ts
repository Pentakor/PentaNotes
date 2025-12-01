import User from './User';
import Folder from './Folder';
import Note from './Note';


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

export { User, Note, Folder};