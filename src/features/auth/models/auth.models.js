const { DataTypes, Model } = require('sequelize');

class User extends Model {}
class AuthCode extends Model {}

function initAuthModels(sequelize) {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(190),
        allowNull: false,
        unique: true,
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'password_hash',
      },
      status: {
        type: DataTypes.ENUM('pending', 'active'),
        allowNull: false,
        defaultValue: 'pending',
      },
      trialEndsAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'trial_ends_at',
      },
    },
    {
      sequelize,
      tableName: 'users',
      modelName: 'User',
    },
  );

  AuthCode.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'user_id',
      },
      purpose: {
        type: DataTypes.ENUM('email_verification', 'password_reset'),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(6),
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'expires_at',
      },
      consumedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'consumed_at',
      },
    },
    {
      sequelize,
      tableName: 'auth_codes',
      modelName: 'AuthCode',
      indexes: [{ fields: ['user_id', 'purpose'] }],
    },
  );

  User.hasMany(AuthCode, {
    foreignKey: 'userId',
    as: 'codes',
    onDelete: 'CASCADE',
  });
  AuthCode.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
  });
}

module.exports = {
  User,
  AuthCode,
  initAuthModels,
};
