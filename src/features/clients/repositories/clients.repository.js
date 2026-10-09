const { Op, fn, col } = require('sequelize');

const { Appointment } = require('../../appointments/models/appointments.models');
const { Client } = require('../models/clients.models');

function escapeLike(value) {
  return String(value).replace(/[\\%_]/g, (char) => `\\${char}`);
}

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

  search(userId, query) {
    const term = String(query).trim();
    const escaped = escapeLike(term);
    const digits = term.replace(/\D/g, '');
    const or = [
      { name: { [Op.like]: `%${escaped}%` } },
      { email: { [Op.like]: `%${escaped}%` } },
    ];
    if (digits.length >= 3) {
      or.push({ phone: { [Op.like]: `%${escapeLike(digits)}%` } });
    }

    return Client.findAll({
      where: {
        userId,
        [Op.or]: or,
      },
      order: [
        ['name', 'ASC'],
        ['createdAt', 'DESC'],
      ],
    });
  }

  async listFrequent(userId, limit = 10) {
    const capped = Math.min(Math.max(Number(limit) || 10, 1), 10);
    const clients = await this.listByUser(userId);
    if (clients.length === 0) return [];

    const counts = await Appointment.findAll({
      attributes: ['clientId', [fn('COUNT', col('id')), 'visitCount']],
      where: {
        userId,
        status: { [Op.ne]: 'cancelled' },
      },
      group: ['clientId'],
      raw: true,
    });
    const visits = new Map(
      counts.map((row) => [
        row.clientId ?? row.client_id,
        Number(row.visitCount) || 0,
      ]),
    );

    return clients
      .map((client) => {
        client.setDataValue('visitCount', visits.get(client.id) ?? 0);
        return client;
      })
      .sort((left, right) => {
        const byVisits = right.get('visitCount') - left.get('visitCount');
        if (byVisits !== 0) return byVisits;
        return left.name.localeCompare(right.name, 'pt');
      })
      .slice(0, capped);
  }
}

module.exports = { ClientsRepository };
