import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface TagAttributes {
  id: number;
  userId: number;
  name: string;
  noteCount: number; // Added counter
}

interface TagCreationAttributes extends Optional<TagAttributes, 'id' | 'noteCount'> {}

class Tag extends Model<TagAttributes, TagCreationAttributes> implements TagAttributes {
  public id!: number;
  public userId!: number;
  public name!: string;
  public noteCount!: number;
}

Tag.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    noteCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    }
  },
  {
    sequelize,
    tableName: 'tags',
    indexes: [
      { fields: ['userId'] },
      { unique: true, fields: ['userId', 'name'] }
    ],
  }
);

export default Tag;