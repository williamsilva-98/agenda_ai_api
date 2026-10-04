const { Op } = require('sequelize');

const { Appointment } = require('../models/appointments.models');

class AppointmentsRepository {
  listByDay(userId, day) {
    return Appointment.findAll({
      where: { userId, day },
      order: [
        ['slot', 'ASC'],
        ['createdAt', 'ASC'],
      ],
    });
  }

  listFrom(userId, day) {
    return Appointment.findAll({
      where: {
        userId,
        day: { [Op.gte]: day },
      },
      order: [
        ['day', 'ASC'],
        ['slot', 'ASC'],
      ],
    });
  }

  listBetween(userId, from, to) {
    return Appointment.findAll({
      where: {
        userId,
        day: { [Op.between]: [from, to] },
      },
      order: [
        ['day', 'ASC'],
        ['slot', 'ASC'],
      ],
    });
  }

  create(userId, data) {
    return Appointment.create({ userId, ...data });
  }

  findById(userId, id) {
    return Appointment.findOne({ where: { id, userId } });
  }

  countByUser(userId) {
    return Appointment.count({ where: { userId } });
  }
}

module.exports = { AppointmentsRepository };
