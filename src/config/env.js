require('dotenv').config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing env ${name}`);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV ?? 'development';

const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? 3000),
  apiPrefix: process.env.API_PREFIX ?? '/v1',
  db: {
    host: required('DB_HOST', '127.0.0.1'),
    port: Number(process.env.DB_PORT ?? 3307),
    name: required('DB_NAME', 'agenda_ai'),
    user: required('DB_USER', 'agenda'),
    password: required('DB_PASSWORD', 'agenda_secret'),
  },
  jwt: {
    secret: required('JWT_SECRET', 'dev-change-me-agenda-ai-secret'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
  otpTtlMinutes: Number(process.env.OTP_TTL_MINUTES ?? 15),
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 10),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  isTest: nodeEnv === 'test',
  isDev: nodeEnv !== 'production',
};

module.exports = { env };
