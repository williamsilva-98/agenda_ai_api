const { connectDatabase, sequelize } = require('../config/database');

async function migrate() {
  await connectDatabase();
  await sequelize.sync({ alter: true });
  console.info('Database synced');
  await sequelize.close();
}

migrate().catch(async (error) => {
  console.error(error);
  await sequelize.close();
  process.exit(1);
});
