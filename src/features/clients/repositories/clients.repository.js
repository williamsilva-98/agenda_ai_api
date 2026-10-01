const { Op } = require('sequelize');

const { Client } = require('../models/clients.models');

class ClientsRepository {
  listByUser(userId) {
    return Client.findAll({
      where: { userId },
      order: [
        ['name', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });
  }

  findByPhone(userId, phone) {
    return Client.findOne({ where: { userId, phone } });
  }

  findById(userId, id) {
    return Client.findOne({ where: { userId, id } });
  }

  create(userId, data) {
    return Client.create({ userId, ...data });
  }

  searchByName(userId, name) {
    return Client.findOne({
      where: {
        userId,
        name: { [Op.like]: name.trim() },
      },
    });
  }
}

module.exports = { ClientsRepository };
