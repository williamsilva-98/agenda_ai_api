const { Router } = require('express');

const { asyncHandler } = require('../../../shared/http/async-handler');
const { requireAuth } = require('../../../shared/http/require-auth');
const {
  AppointmentsController,
} = require('../controllers/appointments.controller');
const {
  AppointmentsRepository,
} = require('../repositories/appointments.repository');
const { AppointmentsService } = require('../services/appointments.service');

function createAppointmentsRoutes() {
  const repository = new AppointmentsRepository();
  const service = new AppointmentsService(repository);
  const controller = new AppointmentsController(service);
  const router = Router();

  router.use(requireAuth);
  router.get('/insights', asyncHandler(controller.insights));
  router.get('/', asyncHandler(controller.list));
  router.post('/', asyncHandler(controller.create));
  router.post('/:id/complete', asyncHandler(controller.complete));
  router.post('/:id/cancel', asyncHandler(controller.cancel));

  return router;
}

module.exports = { createAppointmentsRoutes };
