const {
  appointmentBodySchema,
  cancelBodySchema,
} = require('../schemas/appointments.schemas');

class AppointmentsController {
  constructor(service) {
    this.service = service;
  }

  list = async (req, res) => {
    if (String(req.query.exists ?? '') === '1') {
      const hasAppointments = await this.service.hasAny(req.userId);
      res.status(200).json({ hasAppointments });
      return;
    }

    const clientId = String(req.query.clientId ?? '').trim();
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        clientId,
      )
    ) {
      const appointments = await this.service.listByClient(
        req.userId,
        clientId,
      );
      res.status(200).json({ appointments });
      return;
    }

    const day = String(req.query.day ?? '').trim();
    const from = String(req.query.from ?? '').trim();
    const to = String(req.query.to ?? '').trim();
    const dayOk = /^\d{4}-\d{2}-\d{2}$/.test(day);
    const fromOk = /^\d{4}-\d{2}-\d{2}$/.test(from);
    const toOk = /^\d{4}-\d{2}-\d{2}$/.test(to);

    if (!dayOk && !fromOk) {
      res.status(400).json({
        error: {
          code: 'APPOINTMENT_DAY_REQUIRED',
          message: 'Informe day ou from no formato YYYY-MM-DD.',
        },
      });
      return;
    }

    let appointments;
    if (dayOk) {
      appointments = await this.service.listByDay(req.userId, day);
    } else if (toOk) {
      appointments = await this.service.listBetween(req.userId, from, to);
    } else {
      appointments = await this.service.listFrom(req.userId, from);
    }
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

  cancel = async (req, res) => {
    const body = cancelBodySchema.parse(req.body);
    const appointment = await this.service.cancel(
      req.userId,
      req.params.id,
      body.reason,
    );
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
