const { Router } = require('express');

const { asyncHandler } = require('../../../shared/http/async-handler');
const { requireAuth } = require('../../../shared/http/require-auth');
const { OnboardingController } = require('../controllers/onboarding.controller');
const { OnboardingRepository } = require('../repositories/onboarding.repository');
const { OnboardingService } = require('../services/onboarding.service');

function createOnboardingRoutes() {
  const repository = new OnboardingRepository();
  const service = new OnboardingService(repository);
  const controller = new OnboardingController(service);
  const router = Router();

  router.use(requireAuth);
  router.get('/', asyncHandler(controller.get));
  router.put('/', asyncHandler(controller.save));
  router.post('/complete', asyncHandler(controller.complete));

  return router;
}

module.exports = { createOnboardingRoutes };
