const { Client } = require('../../clients/models/clients.models');
const { ClientNotFoundError } = require('../../clients/errors/clients.errors');
const {
  AppointmentInvalidSlotError,
  AppointmentSlotTakenError,
  AppointmentNotFoundError,
  AppointmentAlreadyCompletedError,
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

  async listByDay(userId, day) {
    const rows = await this.repository.listByDay(userId, day);
    return rows.map((row) => this.toDto(row));
  }

  async listFrom(userId, day) {
    const rows = await this.repository.listFrom(userId, day);
    return rows.map((row) => this.toDto(row));
  }

  async create(userId, input) {
    const client = await Client.findOne({
      where: { id: input.clientId, userId },
    });
    if (!client) {
      throw new ClientNotFoundError();
    }

    const existing = await this.repository.listByDay(userId, input.day);
    const conflict = existing.some((row) =>
      overlaps(
        input.slot,
        input.durationMinutes,
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
      serviceId: input.serviceId,
      serviceName: input.serviceName.trim(),
      day: input.day,
      slot: input.slot,
      durationMinutes: input.durationMinutes,
      priceCents: input.priceCents,
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
    if (appointment.status === 'completed') {
      throw new AppointmentAlreadyCompletedError();
    }

    appointment.status = 'completed';
    appointment.completedAt = new Date();
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
    const completed = isCompleted(appointment);
    return {
      id: appointment.id,
      clientId: appointment.clientId,
      clientName: appointment.clientName,
      clientPhone: appointment.clientPhone,
      serviceId: appointment.serviceId,
      serviceName: appointment.serviceName,
      day: appointment.day,
      slot: appointment.slot,
      durationMinutes: appointment.durationMinutes,
      priceCents: appointment.priceCents,
      notes: appointment.notes,
      status: completed ? 'completed' : appointment.status || 'scheduled',
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

module.exports = { AppointmentsService, isCompleted, endDateTime };
