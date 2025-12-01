import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface NoteLinkAttributes {
  sourceId: number;
  targetId: number;
}

class NoteLink extends Model<NoteLinkAttributes> implements NoteLinkAttributes {
  public sourceId!: number;
  public targetId!: number; 
}

NoteLink.init(
  {
    sourceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'notes',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
     targetId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'notes',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
  },
  {
    sequelize,
    tableName: 'note_links',
    timestamps: false,

    indexes: [
      {
        unique: true,
        fields: ['sourceId', 'targetId'],
        name: 'PK_note_link', // Optional name
      },

      {
        fields: ['targetId'],
        name: 'IDX_targetId_link',
      },
      // You may want to enforce that a note cannot link to itself
      // This is usually done with a CHECK constraint in pure SQL, 
      // but can be handled in application logic or with a trigger.
    ],
   
  }
);

export default NoteLink;