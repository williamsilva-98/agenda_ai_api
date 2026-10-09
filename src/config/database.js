const { Sequelize } = require('sequelize');

const { env } = require('./env');
const { initAuthModels } = require('../features/auth/models/auth.models');
const {
  initOnboardingModels,
  CATEGORIES,
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
  if (!table.cancel_reason) {
    await queryInterface.addColumn('appointments', 'cancel_reason', {
      type: Sequelize.STRING(40),
      allowNull: true,
    });
  }
}

async function ensureBusinessCategories() {
  if (sequelize.getDialect() !== 'mysql') return;
  const listed = CATEGORIES.map((item) => sequelize.escape(item)).join(', ');
  await sequelize.query(
    `ALTER TABLE businesses MODIFY COLUMN category ENUM(${listed}) NOT NULL`,
  );
}

async function ensureAppointmentServiceLines() {
  const queryInterface = sequelize.getQueryInterface();
  let table;
  try {
    table = await queryInterface.describeTable('appointments');
  } catch (_) {
    return;
  }
  if (!table.services) {
    await queryInterface.addColumn('appointments', 'services', {
      type: Sequelize.JSON,
      allowNull: true,
    });
  }
  const nameType = String(table.service_name?.type ?? '');
  if (table.service_name && !nameType.includes('500')) {
    await queryInterface.changeColumn('appointments', 'service_name', {
      type: Sequelize.STRING(500),
      allowNull: false,
    });
  }
}

async function ensureBusinessAgendaColumns() {
  const queryInterface = sequelize.getQueryInterface();
  let table;
  try {
    table = await queryInterface.describeTable('businesses');
  } catch (_) {
    return;
  }
  if (!table.open_until) {
    await queryInterface.addColumn('businesses', 'open_until', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
  }
  if (!table.day_overrides) {
    await queryInterface.addColumn('businesses', 'day_overrides', {
      type: Sequelize.JSON,
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
    await ensureAppointmentServiceLines();
    await ensureBusinessCategories();
    await ensureBusinessAgendaColumns();
  } catch (_) {
    // Tabela ainda não existe em ambientes novos; o sync já cobre.
  }
}

module.exports = {
  sequelize,
  registerModels,
  connectDatabase,
};
