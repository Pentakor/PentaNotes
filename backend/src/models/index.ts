import User from './User';
import Note from './Note';

// Define associations
User.hasMany(Note, {
  foreignKey: 'userId',
  as: 'notes',
});

Note.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

export { User, Note };