const { AppError } = require('../../../shared/errors/app-error');

class ClientPhoneInUseError extends AppError {
  constructor() {
    super(
      'Já existe um cliente com este telefone.',
      409,
      'CLIENT_PHONE_IN_USE',
    );
  }
}

class ClientNotFoundError extends AppError {
  constructor() {
    super('Cliente não encontrado.', 404, 'CLIENT_NOT_FOUND');
  }
}

module.exports = {
  ClientPhoneInUseError,
  ClientNotFoundError,
};
