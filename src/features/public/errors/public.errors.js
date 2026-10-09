const { AppError } = require('../../../shared/errors/app-error');

class PublicBusinessNotFoundError extends AppError {
  constructor() {
    super('Não encontramos esse negócio.', 404, 'PUBLIC_BUSINESS_NOT_FOUND');
  }
}

class PublicServiceNotFoundError extends AppError {
  constructor() {
    super('Esse serviço não está disponível.', 422, 'PUBLIC_SERVICE_NOT_FOUND');
  }
}

module.exports = {
  PublicBusinessNotFoundError,
  PublicServiceNotFoundError,
};
