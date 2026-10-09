const { createApp } = require('./app');
const { connectDatabase } = require('./config/database');
const { env } = require('./config/env');

async function main() {
  await connectDatabase();
  const app = createApp();
  app.listen(env.port, () => {
    console.info(`AgendaX API listening on :${env.port}${env.apiPrefix}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
