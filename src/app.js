const cors = require('cors');
const express = require('express');

const { env } = require('./config/env');
const { createAuthRoutes } = require('./features/auth/routes/auth.routes');
const {
  createOnboardingRoutes,
} = require('./features/onboarding/routes/onboarding.routes');
const {
  createClientsRoutes,
} = require('./features/clients/routes/clients.routes');
const {
  createAppointmentsRoutes,
} = require('./features/appointments/routes/appointments.routes');
const { createPublicRoutes } = require('./features/public/routes/public.routes');
const { errorHandler } = require('./shared/http/error-handler');

function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin === '*' ? true : env.corsOrigin }));
  app.use(express.json({ limit: '2mb' }));

  const api = express.Router();
  api.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  api.use('/auth', createAuthRoutes());
  api.use('/onboarding', createOnboardingRoutes());
  api.use('/clients', createClientsRoutes());
  api.use('/appointments', createAppointmentsRoutes());
  api.use('/public', createPublicRoutes());

  app.use(env.apiPrefix, api);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
