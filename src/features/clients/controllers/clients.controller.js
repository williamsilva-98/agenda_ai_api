const { clientBodySchema } = require('../schemas/clients.schemas');

class ClientsController {
  constructor(service) {
    this.service = service;
  }

  list = async (req, res) => {
    const clients = await this.service.list(req.userId);
    res.status(200).json({ clients });
  };

  get = async (req, res) => {
    const client = await this.service.get(req.userId, req.params.id);
    res.status(200).json(client);
  };

  create = async (req, res) => {
    const body = clientBodySchema.parse(req.body);
    const client = await this.service.create(req.userId, body);
    res.status(201).json(client);
  };
}

module.exports = { ClientsController };
