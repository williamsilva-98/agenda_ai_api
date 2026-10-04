const { DataTypes, Model } = require('sequelize');

const { User } = require('../../auth/models/auth.models');

class Business extends Model {}
class BusinessService extends Model {}
class BusinessHour extends Model {}

const CATEGORIES = [
  'beauty',
  'fitness',
  'health',
  'pet',
  'art',
  'education',
  'auto',
  'home',
  'events',
  'consulting',
  'wellness',
  'food',
  'other',
];
const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

function initOnboardingModels(sequelize) {
  Business.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        field: 'user_id',
      },
      category: {
        type: DataTypes.ENUM(...CATEGORIES),
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      city: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      whatsapp: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: '',
      },
      slug: {
        type: DataTypes.STRING(160),
        allowNull: false,
        unique: true,
      },
      photoUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        field: 'photo_url',
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'completed_at',
      },
      openUntil: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'open_until',
      },
      dayOverrides: {
        type: DataTypes.JSON,
        allowNull: true,
        field: 'day_overrides',
      },
    },
    {
      sequelize,
      tableName: 'businesses',
      modelName: 'Business',
    },
  );

  BusinessService.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      businessId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'business_id',
      },
      clientKey: {
        type: DataTypes.STRING(80),
        allowNull: false,
        field: 'client_key',
      },
      name: {
        type: DataTypes.STRING(120),
        allowNull: false,
      },
      durationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'duration_minutes',
      },
      priceCents: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'price_cents',
      },
      selected: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'sort_order',
      },
    },
    {
      sequelize,
      tableName: 'business_services',
      modelName: 'BusinessService',
    },
  );

  BusinessHour.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      businessId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'business_id',
      },
      weekday: {
        type: DataTypes.ENUM(...WEEKDAYS),
        allowNull: false,
      },
      slots: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
    },
    {
      sequelize,
      tableName: 'business_hours',
      modelName: 'BusinessHour',
      indexes: [{ unique: true, fields: ['business_id', 'weekday'] }],
    },
  );

  User.hasOne(Business, {
    foreignKey: 'userId',
    as: 'business',
    onDelete: 'CASCADE',
  });
  Business.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
  });

  Business.hasMany(BusinessService, {
    foreignKey: 'businessId',
    as: 'services',
    onDelete: 'CASCADE',
  });
  BusinessService.belongsTo(Business, {
    foreignKey: 'businessId',
    as: 'business',
  });

  Business.hasMany(BusinessHour, {
    foreignKey: 'businessId',
    as: 'hours',
    onDelete: 'CASCADE',
  });
  BusinessHour.belongsTo(Business, {
    foreignKey: 'businessId',
    as: 'business',
  });
}

module.exports = {
  Business,
  BusinessService,
  BusinessHour,
  CATEGORIES,
  WEEKDAYS,
  initOnboardingModels,
};
