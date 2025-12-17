import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface NoteTagAttributes {
  noteId: number;
  tagId: number;
}

class NoteTag extends Model<NoteTagAttributes> implements NoteTagAttributes {
  public noteId!: number;
  public tagId!: number; 
}

NoteTag.init(
  {
    noteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'notes',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
     tagId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tags',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'note_tags',
    timestamps: false,

    indexes: [
      {
        unique: true,
        fields: ['noteId', 'tagId'],
        name: 'PK_note_tag', // Optional name
      },

      {
        fields: ['tagId'],
        name: 'IDX_tagId',
      },

    ],
   
  }
);

export default NoteTag;