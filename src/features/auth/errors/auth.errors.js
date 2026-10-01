const { AppError } = require('../../../shared/errors/app-error');

class InvalidCredentialsError extends AppError {
  constructor() {
    super('E-mail ou senha incorretos', 401, 'INVALID_CREDENTIALS');
  }
}

class EmailInUseError extends AppError {
  constructor() {
    super('Este e-mail já está em uso.', 409, 'EMAIL_IN_USE');
  }
}

class InvalidOtpError extends AppError {
  constructor() {
    super('Código inválido', 400, 'INVALID_OTP');
  }
}

class UserNotFoundError extends AppError {
  constructor() {
    super('Conta não encontrada.', 404, 'USER_NOT_FOUND');
  }
}

module.exports = {
  InvalidCredentialsError,
  EmailInUseError,
  InvalidOtpError,
  UserNotFoundError,
};
