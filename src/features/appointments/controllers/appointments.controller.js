const { appointmentBodySchema } = require('../schemas/appointments.schemas');

class AppointmentsController {
  constructor(service) {
    this.service = service;
  }

  list = async (req, res) => {
    const day = String(req.query.day ?? '').trim();
    const from = String(req.query.from ?? '').trim();
    const dayOk = /^\d{4}-\d{2}-\d{2}$/.test(day);
    const fromOk = /^\d{4}-\d{2}-\d{2}$/.test(from);

    if (!dayOk && !fromOk) {
      res.status(400).json({
        error: {
          code: 'APPOINTMENT_DAY_REQUIRED',
          message: 'Informe day ou from no formato YYYY-MM-DD.',
        },
      });
      return;
    }

    const appointments = dayOk
      ? await this.service.listByDay(req.userId, day)
      : await this.service.listFrom(req.userId, from);
    res.status(200).json({ appointments });
  };

  create = async (req, res) => {
    const body = appointmentBodySchema.parse(req.body);
    const appointment = await this.service.create(req.userId, body);
    res.status(201).json(appointment);
  };

  complete = async (req, res) => {
    const appointment = await this.service.complete(req.userId, req.params.id);
    res.status(200).json(appointment);
  };

  insights = async (req, res) => {
    const period = String(req.query.period ?? 'month').trim().toLowerCase();
    const anchor = String(req.query.anchor ?? '').trim();
    const allowed = new Set(['day', 'month', 'year']);
    if (!allowed.has(period)) {
      res.status(400).json({
        error: {
          code: 'INSIGHTS_PERIOD_INVALID',
          message: 'period deve ser day, month ou year.',
        },
      });
      return;
    }
    if (anchor && !/^\d{4}-\d{2}-\d{2}$/.test(anchor)) {
      res.status(400).json({
        error: {
          code: 'INSIGHTS_ANCHOR_INVALID',
          message: 'anchor deve estar no formato YYYY-MM-DD.',
        },
      });
      return;
    }

    const insights = await this.service.insights(req.userId, {
      period,
      anchor: anchor || undefined,
    });
    res.status(200).json(insights);
  };
}

module.exports = { AppointmentsController };
