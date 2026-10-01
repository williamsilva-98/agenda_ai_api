const { DataTypes, Model } = require('sequelize');

const { User } = require('../../auth/models/auth.models');

class Client extends Model {}

function initClientsModels(sequelize) {
  Client.init(
    {
      id: {
        type: DataTypes.CHAR(36),
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'user_id',
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(190),
        allowNull: false,
        defaultValue: '',
      },
      cep: {
        type: DataTypes.STRING(8),
        allowNull: false,
        defaultValue: '',
      },
      street: {
        type: DataTypes.STRING(160),
        allowNull: false,
        defaultValue: '',
      },
      number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: '',
      },
      complement: {
        type: DataTypes.STRING(120),
        allowNull: false,
        defaultValue: '',
      },
      neighborhood: {
        type: DataTypes.STRING(120),
        allowNull: false,
        defaultValue: '',
      },
      city: {
        type: DataTypes.STRING(120),
        allowNull: false,
        defaultValue: '',
      },
      stateCode: {
        type: DataTypes.STRING(2),
        allowNull: false,
        defaultValue: '',
        field: 'state_code',
      },
      notes: {
        type: DataTypes.STRING(500),
        allowNull: false,
        defaultValue: '',
      },
    },
    {
      sequelize,
      tableName: 'clients',
      modelName: 'Client',
      // Mesma collation de `users` (legado Laravel); senão a FK falha no MySQL 8.
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      indexes: [
        { fields: ['user_id'] },
        { unique: true, fields: ['user_id', 'phone'] },
      ],
    },
  );

  User.hasMany(Client, {
    foreignKey: 'userId',
    as: 'clients',
    onDelete: 'CASCADE',
  });
  Client.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
  });
}

module.exports = {
  Client,
  initClientsModels,
};
