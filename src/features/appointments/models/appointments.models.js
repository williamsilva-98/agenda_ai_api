const { DataTypes, Model } = require('sequelize');

const { User } = require('../../auth/models/auth.models');
const { Client } = require('../../clients/models/clients.models');

class Appointment extends Model {}

function initAppointmentsModels(sequelize) {
  Appointment.init(
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
      clientId: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        field: 'client_id',
      },
      clientName: {
        type: DataTypes.STRING(120),
        allowNull: false,
        field: 'client_name',
      },
      clientPhone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: '',
        field: 'client_phone',
      },
      serviceId: {
        type: DataTypes.STRING(80),
        allowNull: false,
        field: 'service_id',
      },
      serviceName: {
        type: DataTypes.STRING(500),
        allowNull: false,
        field: 'service_name',
      },
      services: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      day: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      slot: {
        type: DataTypes.STRING(5),
        allowNull: false,
      },
      durationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
        field: 'duration_minutes',
      },
      priceCents: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'price_cents',
      },
      notes: {
        type: DataTypes.STRING(500),
        allowNull: false,
        defaultValue: '',
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'scheduled',
      },
      completedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'completed_at',
      },
      cancelReason: {
        type: DataTypes.STRING(40),
        allowNull: true,
        field: 'cancel_reason',
      },
    },
    {
      sequelize,
      tableName: 'appointments',
      modelName: 'Appointment',
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      indexes: [
        { fields: ['user_id', 'day'] },
        { fields: ['user_id', 'day', 'slot'] },
      ],
    },
  );

  User.hasMany(Appointment, {
    foreignKey: 'userId',
    as: 'appointments',
    onDelete: 'CASCADE',
  });
  Appointment.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
  });
  Client.hasMany(Appointment, {
    foreignKey: 'clientId',
    as: 'appointments',
    onDelete: 'CASCADE',
  });
  Appointment.belongsTo(Client, {
    foreignKey: 'clientId',
    as: 'client',
  });
}

module.exports = {
  Appointment,
  initAppointmentsModels,
};
