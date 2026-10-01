const { Router } = require('express');

const { asyncHandler } = require('../../../shared/http/async-handler');
const { AuthController } = require('../controllers/auth.controller');
const { AuthRepository } = require('../repositories/auth.repository');
const { AuthService } = require('../services/auth.service');

function createAuthRoutes() {
  const repository = new AuthRepository();
  const service = new AuthService(repository);
  const controller = new AuthController(service);
  const router = Router();

  router.post('/sign-up', asyncHandler(controller.signUp));
  router.post('/verify-email', asyncHandler(controller.verifyEmail));
  router.post('/resend-code', asyncHandler(controller.resendCode));
  router.post('/sign-in', asyncHandler(controller.signIn));
  router.post('/forgot-password', asyncHandler(controller.forgotPassword));
  router.post('/reset-password', asyncHandler(controller.resetPassword));

  return router;
}

module.exports = { createAuthRoutes };
