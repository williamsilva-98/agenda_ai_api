#!/bin/sh
set -e

echo "Waiting for MySQL..."
i=0
until node -e "
const mysql = require('mysql2/promise');
(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'mysql',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await conn.end();
})().catch(() => process.exit(1));
"; do
  i=$((i + 1))
  if [ "$i" -ge 60 ]; then
    echo "MySQL did not become ready in time"
    exit 1
  fi
  sleep 2
done

node src/scripts/migrate.js
node src/scripts/seed.js
exec node src/server.js
