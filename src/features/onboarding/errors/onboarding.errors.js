const { AppError } = require('../../../shared/errors/app-error');

class OnboardingNotFoundError extends AppError {
  constructor() {
    super('Onboarding ainda não iniciado.', 404, 'ONBOARDING_NOT_FOUND');
  }
}

class OnboardingIncompleteError extends AppError {
  constructor(message = 'Complete os dados do negócio para finalizar.') {
    super(message, 400, 'ONBOARDING_INCOMPLETE');
  }
}

module.exports = {
  OnboardingNotFoundError,
  OnboardingIncompleteError,
};
