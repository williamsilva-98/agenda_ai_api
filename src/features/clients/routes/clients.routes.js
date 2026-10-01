const { Router } = require('express');

const { asyncHandler } = require('../../../shared/http/async-handler');
const { requireAuth } = require('../../../shared/http/require-auth');
const { ClientsController } = require('../controllers/clients.controller');
const { ClientsRepository } = require('../repositories/clients.repository');
const { ClientsService } = require('../services/clients.service');

function createClientsRoutes() {
  const repository = new ClientsRepository();
  const service = new ClientsService(repository);
  const controller = new ClientsController(service);
  const router = Router();

  router.use(requireAuth);
  router.get('/', asyncHandler(controller.list));
  router.get('/:id', asyncHandler(controller.get));
  router.post('/', asyncHandler(controller.create));

  return router;
}

module.exports = { createClientsRoutes };
