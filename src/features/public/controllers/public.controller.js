const {
  availabilityQuerySchema,
  bookingBodySchema,
} = require('../schemas/public.schemas');

class PublicController {
  constructor(service) {
    this.service = service;
  }

  show = async (req, res) => {
    const page = await this.service.page(req.params.slug);
    res.status(200).json(page);
  };

  availability = async (req, res) => {
    const query = availabilityQuerySchema.parse(req.query);
    const body = await this.service.availability(req.params.slug, query.day);
    res.status(200).json(body);
  };

  book = async (req, res) => {
    const input = bookingBodySchema.parse(req.body);
    const booking = await this.service.book(req.params.slug, input);
    res.status(201).json(booking);
  };
}

module.exports = { PublicController };
