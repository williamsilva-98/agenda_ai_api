const { Sequelize } = require('sequelize');

const { env } = require('./env');
const { initAuthModels } = require('../features/auth/models/auth.models');
const {
  initOnboardingModels,
} = require('../features/onboarding/models/onboarding.models');
const {
  initClientsModels,
} = require('../features/clients/models/clients.models');
const {
  initAppointmentsModels,
} = require('../features/appointments/models/appointments.models');

const useSqlite = env.isTest && process.env.DB_DIALECT !== 'mysql';

const sequelize = useSqlite
  ? new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:',
      logging: false,
      define: {
        underscored: true,
        timestamps: true,
      },
    })
  : new Sequelize(env.db.name, env.db.user, env.db.password, {
      host: env.db.host,
      port: env.db.port,
      dialect: 'mysql',
      logging: env.isDev && !env.isTest ? console.log : false,
      define: {
        underscored: true,
        timestamps: true,
      },
    });

function registerModels() {
  initAuthModels(sequelize);
  initOnboardingModels(sequelize);
  initClientsModels(sequelize);
  initAppointmentsModels(sequelize);
}

async function ensureAppointmentStatusColumns() {
  const queryInterface = sequelize.getQueryInterface();
  const table = await queryInterface.describeTable('appointments');
  if (!table.status) {
    await queryInterface.addColumn('appointments', 'status', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'scheduled',
    });
  }
  if (!table.completed_at) {
    await queryInterface.addColumn('appointments', 'completed_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });
  }
}

async function connectDatabase() {
  registerModels();
  await sequelize.authenticate();
  await sequelize.sync();
  try {
    await ensureAppointmentStatusColumns();
  } catch (_) {
    // Tabela ainda não existe em ambientes novos; o sync já cobre.
  }
}

module.exports = {
  sequelize,
  registerModels,
  connectDatabase,
};
