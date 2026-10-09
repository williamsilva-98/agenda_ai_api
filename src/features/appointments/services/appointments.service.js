const { Client } = require('../../clients/models/clients.models');
const { ClientNotFoundError } = require('../../clients/errors/clients.errors');
const {
  AppointmentInvalidSlotError,
  AppointmentSlotTakenError,
  AppointmentNotFoundError,
  AppointmentAlreadyCompletedError,
  AppointmentAlreadyCancelledError,
} = require('../errors/appointments.errors');
const {
  buildRanges,
  buildInsights,
  dayKey,
} = require('./appointments.insights');

function parseMinutes(label) {
  const [hours, minutes] = String(label).split(':').map(Number);
  return hours * 60 + minutes;
}

function visitFrom(input) {
  const raw =
    Array.isArray(input.services) && input.services.length
      ? input.services
      : [
          {
            serviceId: input.serviceId,
            serviceName: input.serviceName,
            durationMinutes: input.durationMinutes,
            priceCents: input.priceCents,
          },
        ];
  const services = [];
  const seen = new Set();
  for (const line of raw) {
    const serviceId = String(line.serviceId || '').trim();
    if (!serviceId || seen.has(serviceId)) continue;
    seen.add(serviceId);
    services.push({
      serviceId,
      serviceName: String(line.serviceName || '').trim(),
      durationMinutes: Number(line.durationMinutes),
      priceCents: Number(line.priceCents),
    });
  }
  return {
    services,
    serviceId: services[0].serviceId,
    serviceName: services.map((line) => line.serviceName).join(' · '),
    durationMinutes: Math.max(
      ...services.map((line) => line.durationMinutes),
    ),
    priceCents: services.reduce((sum, line) => sum + line.priceCents, 0),
  };
}

function storedServices(appointment) {
  let stored = appointment.services;
  if (typeof stored === 'string') {
    try {
      stored = JSON.parse(stored);
    } catch (_) {
      stored = null;
    }
  }
  if (Array.isArray(stored) && stored.length) {
    return stored.map((line) => ({
      serviceId: line.serviceId,
      serviceName: line.serviceName,
      durationMinutes: Number(line.durationMinutes),
      priceCents: Number(line.priceCents),
    }));
  }
  return [
    {
      serviceId: appointment.serviceId,
      serviceName: appointment.serviceName,
      durationMinutes: appointment.durationMinutes,
      priceCents: appointment.priceCents,
    },
  ];
}

function overlaps(slot, duration, bookingSlot, bookingDuration) {
  const start = parseMinutes(slot);
  const end = start + duration;
  const bookingStart = parseMinutes(bookingSlot);
  const bookingEnd = bookingStart + bookingDuration;
  return start < bookingEnd && end > bookingStart;
}

function endDateTime(day, slot, durationMinutes) {
  const start = parseMinutes(slot);
  const end = start + Number(durationMinutes || 0);
  const dayKey = String(day).slice(0, 10);
  const hours = String(Math.floor(end / 60)).padStart(2, '0');
  const minutes = String(end % 60).padStart(2, '0');
  return new Date(`${dayKey}T${hours}:${minutes}:00`);
}

function isCompleted(appointment, now = new Date()) {
  if (appointment.status === 'cancelled') return false;
  if (appointment.status === 'completed') return true;
  const end = endDateTime(
    appointment.day,
    appointment.slot,
    appointment.durationMinutes,
  );
  return now.getTime() >= end.getTime();
}

class AppointmentsService {
  constructor(repository) {
    this.repository = repository;
  }

  async hasAny(userId) {
    const count = await this.repository.countByUser(userId);
    return count > 0;
  }

  async listByDay(userId, day) {
    const rows = await this.repository.listByDay(userId, day);
    return rows.map((row) => this.toDto(row));
  }

  async listFrom(userId, day) {
    const rows = await this.repository.listFrom(userId, day);
    return rows.map((row) => this.toDto(row));
  }

  async listByClient(userId, clientId) {
    const rows = await this.repository.listByClient(userId, clientId);
    return rows.map((row) => this.toDto(row));
  }

  async listBetween(userId, from, to) {
    const rows = await this.repository.listBetween(userId, from, to);
    return rows.map((row) => this.toDto(row));
  }

  async create(userId, input) {
    const client = await Client.findOne({
      where: { id: input.clientId, userId },
    });
    if (!client) {
      throw new ClientNotFoundError();
    }

    const visit = visitFrom(input);
    const existing = await this.repository.listByDay(userId, input.day);
    const conflict = existing.some(
      (row) =>
        row.status !== 'cancelled' &&
        overlaps(
          input.slot,
          visit.durationMinutes,
          row.slot,
          row.durationMinutes,
        ),
    );
    if (conflict) {
      throw new AppointmentSlotTakenError();
    }

    if (!/^\d{2}:\d{2}$/.test(input.slot)) {
      throw new AppointmentInvalidSlotError();
    }

    const appointment = await this.repository.create(userId, {
      clientId: client.id,
      clientName: client.name,
      clientPhone: client.phone ?? '',
      serviceId: visit.serviceId,
      serviceName: visit.serviceName,
      services: visit.services,
      day: input.day,
      slot: input.slot,
      durationMinutes: visit.durationMinutes,
      priceCents: visit.priceCents,
      notes: input.notes ?? '',
      status: 'scheduled',
    });

    return this.toDto(appointment);
  }

  async complete(userId, id) {
    const appointment = await this.repository.findById(userId, id);
    if (!appointment) {
      throw new AppointmentNotFoundError();
    }
    if (appointment.status === 'cancelled') {
      throw new AppointmentAlreadyCancelledError();
    }
    if (appointment.status === 'completed') {
      throw new AppointmentAlreadyCompletedError();
    }

    appointment.status = 'completed';
    appointment.completedAt = new Date();
    await appointment.save();
    return this.toDto(appointment);
  }

  async cancel(userId, id, reason) {
    const appointment = await this.repository.findById(userId, id);
    if (!appointment) {
      throw new AppointmentNotFoundError();
    }
    if (appointment.status === 'cancelled') {
      throw new AppointmentAlreadyCancelledError();
    }

    appointment.status = 'cancelled';
    appointment.cancelReason = reason;
    appointment.completedAt = null;
    await appointment.save();
    return this.toDto(appointment);
  }

  async insights(userId, { period = 'month', anchor } = {}) {
    const allowed = new Set(['day', 'month', 'year']);
    const selected = allowed.has(period) ? period : 'month';
    const ranges = buildRanges(selected, anchor || dayKey(new Date()));
    const fetchFrom =
      ranges.seriesFrom < ranges.prevFrom ? ranges.seriesFrom : ranges.prevFrom;
    const fetchTo = ranges.to > ranges.prevTo ? ranges.to : ranges.prevTo;
    const rows = await this.repository.listBetween(userId, fetchFrom, fetchTo);

    const inRange = (row, from, to) => {
      const key = dayKey(row.day);
      return key >= from && key <= to;
    };

    const current = rows.filter((row) => inRange(row, ranges.from, ranges.to));
    const previous = rows.filter((row) =>
      inRange(row, ranges.prevFrom, ranges.prevTo),
    );
    const seriesRows = rows.filter((row) =>
      inRange(row, ranges.seriesFrom, ranges.to),
    );

    return buildInsights(current, previous, seriesRows, ranges);
  }

  toDto(appointment) {
    const cancelled = appointment.status === 'cancelled';
    const completed = !cancelled && isCompleted(appointment);
    return {
      id: appointment.id,
      clientId: appointment.clientId,
      clientName: appointment.clientName,
      clientPhone: appointment.clientPhone,
      serviceId: appointment.serviceId,
      serviceName: appointment.serviceName,
      services: storedServices(appointment),
      day: appointment.day,
      slot: appointment.slot,
      durationMinutes: appointment.durationMinutes,
      priceCents: appointment.priceCents,
      notes: appointment.notes,
      status: cancelled
        ? 'cancelled'
        : completed
          ? 'completed'
          : appointment.status || 'scheduled',
      cancelReason: appointment.cancelReason ?? null,
      completed,
      completedAt: appointment.completedAt
        ? new Date(appointment.completedAt).toISOString()
        : null,
      createdAt: appointment.createdAt
        ? appointment.createdAt.toISOString()
        : null,
    };
  }
}

module.exports = {
  AppointmentsService,
  isCompleted,
  endDateTime,
  visitFrom,
};
