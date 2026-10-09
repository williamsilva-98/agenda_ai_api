const { Router } = require('express');

const { asyncHandler } = require('../../../shared/http/async-handler');
const { AppointmentsRepository } = require('../../appointments/repositories/appointments.repository');
const { AppointmentsService } = require('../../appointments/services/appointments.service');
const { ClientsRepository } = require('../../clients/repositories/clients.repository');
const { OnboardingRepository } = require('../../onboarding/repositories/onboarding.repository');
const { PublicController } = require('../controllers/public.controller');
const { PublicService } = require('../services/public.service');

function createPublicRoutes() {
  const service = new PublicService(
    new OnboardingRepository(),
    new AppointmentsService(new AppointmentsRepository()),
    new ClientsRepository(),
  );
  const controller = new PublicController(service);
  const router = Router();

  router.get('/:slug/availability', asyncHandler(controller.availability));
  router.post('/:slug/bookings', asyncHandler(controller.book));
  router.get('/:slug', asyncHandler(controller.show));

  return router;
}

module.exports = { createPublicRoutes };
