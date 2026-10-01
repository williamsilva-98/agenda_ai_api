const { AppError } = require('../../../shared/errors/app-error');

class AppointmentSlotTakenError extends AppError {
  constructor() {
    super('Este horário já está ocupado.', 409, 'APPOINTMENT_SLOT_TAKEN');
  }
}

class AppointmentInvalidSlotError extends AppError {
  constructor(message = 'Horário indisponível para este serviço.') {
    super(message, 422, 'APPOINTMENT_INVALID_SLOT');
  }
}

class AppointmentNotFoundError extends AppError {
  constructor() {
    super('Agendamento não encontrado.', 404, 'APPOINTMENT_NOT_FOUND');
  }
}

class AppointmentAlreadyCompletedError extends AppError {
  constructor() {
    super('Este agendamento já foi concluído.', 409, 'APPOINTMENT_ALREADY_COMPLETED');
  }
}

module.exports = {
  AppointmentSlotTakenError,
  AppointmentInvalidSlotError,
  AppointmentNotFoundError,
  AppointmentAlreadyCompletedError,
};
