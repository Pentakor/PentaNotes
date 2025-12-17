import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

interface FolderAttributes {
  id: number;
  userId: number;
  title: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface FolderCreationAttributes extends Optional<FolderAttributes, 'id'> {}

class Folder extends Model<FolderAttributes, FolderCreationAttributes> implements FolderAttributes {
  public id!: number;
  public userId!: number;
  public title!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Folder.init(
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    }
  },
  {
    sequelize,
    tableName: 'folders',
    timestamps: true,

    indexes: [
      { fields: ['userId'] },
      {
        unique: true,
        fields: ['userId', 'title'],
        name: 'unique_user_folder_title',
      },
    ],
  }
);

export default Folder;