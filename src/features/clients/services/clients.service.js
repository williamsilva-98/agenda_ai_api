const {
  ClientNotFoundError,
  ClientPhoneInUseError,
} = require('../errors/clients.errors');

class ClientsService {
  constructor(repository) {
    this.repository = repository;
  }

  async list(userId) {
    const rows = await this.repository.listByUser(userId);
    return rows.map((row) => this.toDto(row));
  }

  async get(userId, id) {
    const client = await this.repository.findById(userId, id);
    if (!client) {
      throw new ClientNotFoundError();
    }
    return this.toDto(client);
  }

  async create(userId, input) {
    const existing = await this.repository.findByPhone(userId, input.phone);
    if (existing) {
      throw new ClientPhoneInUseError();
    }

    const client = await this.repository.create(userId, {
      name: input.name.trim(),
      phone: input.phone,
      email: input.email ?? '',
      cep: input.cep ?? '',
      street: input.street ?? '',
      number: input.number ?? '',
      complement: input.complement ?? '',
      neighborhood: input.neighborhood ?? '',
      city: input.city ?? '',
      stateCode: input.stateCode ?? '',
      notes: input.notes ?? '',
    });

    return this.toDto(client);
  }

  toDto(client) {
    const place = [client.city, client.stateCode].filter(Boolean).join(' — ');
    return {
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email,
      cep: client.cep,
      street: client.street,
      number: client.number,
      complement: client.complement,
      neighborhood: client.neighborhood,
      city: client.city,
      stateCode: client.stateCode,
      notes: client.notes,
      place,
      createdAt: client.createdAt ? client.createdAt.toISOString() : null,
    };
  }
}

module.exports = { ClientsService };
