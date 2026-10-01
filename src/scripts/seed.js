const { connectDatabase, sequelize } = require('../config/database');
const { AuthRepository } = require('../features/auth/repositories/auth.repository');
const { hashPassword } = require('../shared/security/password');

async function seed() {
  await connectDatabase();
  const repository = new AuthRepository();
  const email = 'williamhenrique.silva98@gmail.com';
  const existing = await repository.findByEmail(email);
  if (existing) {
    console.info('Seed user already exists');
    await sequelize.close();
    return;
  }

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);
  await repository.createUser({
    name: 'William Henrique',
    email,
    passwordHash: await hashPassword('12345'),
    status: 'active',
    trialEndsAt,
  });
  console.info('Seed user created:', email);
  await sequelize.close();
}

seed().catch(async (error) => {
  console.error(error);
  await sequelize.close();
  process.exit(1);
});
