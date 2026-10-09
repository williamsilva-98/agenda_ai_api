const { Client } = require('../../clients/models/clients.models');
const { ClientsRepository } = require('../../clients/repositories/clients.repository');
const {
  AppointmentInvalidSlotError,
} = require('../../appointments/errors/appointments.errors');
const { AppointmentsService } = require('../../appointments/services/appointments.service');
const { WEEKDAYS } = require('../../onboarding/models/onboarding.models');
const {
  normalizeOverrides,
  normalizeRanges,
  parseMinutes,
} = require('../../onboarding/services/hours');
const {
  PublicBusinessNotFoundError,
  PublicServiceNotFoundError,
} = require('../errors/public.errors');

const CATEGORY_LABELS = {
  beauty: 'Beleza',
  fitness: 'Fitness',
  health: 'Saúde',
  pet: 'Pet',
  art: 'Arte',
  education: 'Educação',
  auto: 'Automotivo',
  home: 'Casa',
  events: 'Eventos',
  consulting: 'Consultoria',
  wellness: 'Bem-estar',
  food: 'Alimentação',
  other: 'Outros',
};

class PublicService {
  constructor(onboarding, appointments, clients) {
    this.onboarding = onboarding;
    this.appointments = appointments;
    this.clients = clients;
  }

  async page(slug) {
    const business = await this.#business(slug);
    return this.toPage(business);
  }

  async availability(slug, day) {
    const business = await this.#business(slug);
    const rows = await this.appointments.listByDay(business.userId, day);
    return {
      occupied: rows
        .filter((row) => row.status !== 'cancelled')
        .map((row) => ({
          slot: row.slot,
          durationMinutes: row.durationMinutes,
        })),
    };
  }

  async book(slug, input) {
    const business = await this.#business(slug);
    const service = (business.services ?? []).find(
      (item) => item.selected && item.clientKey === input.serviceId,
    );
    if (!service) {
      throw new PublicServiceNotFoundError();
    }

    const ranges = rangesOn(business, input.day);
    if (!slotFits(input.slot, service.durationMinutes, ranges) || isPast(input.day, input.slot)) {
      throw new AppointmentInvalidSlotError();
    }

    const client = await this.#client(business.userId, input);
    return this.appointments.create(business.userId, {
      clientId: client.id,
      serviceId: service.clientKey,
      serviceName: service.name,
      day: input.day,
      slot: input.slot,
      durationMinutes: service.durationMinutes,
      priceCents: service.priceCents,
    });
  }

  toPage(business) {
    const hours = Object.fromEntries(WEEKDAYS.map((day) => [day, []]));
    for (const row of business.hours ?? []) {
      hours[row.weekday] = normalizeRanges(row.slots);
    }

    const services = [...(business.services ?? [])]
      .filter((service) => service.selected)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((service) => ({
        id: service.clientKey,
        name: service.name,
        durationMinutes: service.durationMinutes,
        priceCents: service.priceCents,
      }));

    const category = CATEGORY_LABELS[business.category] ?? '';
    const city = String(business.city ?? '').trim();

    return {
      name: business.name,
      slug: business.slug,
      subtitle: [category, city].filter(Boolean).join(' · '),
      services,
      hours,
      openUntil: dateOnly(business.openUntil),
      dayOverrides: readOverrides(business.dayOverrides),
    };
  }

  async #business(slug) {
    const business = await this.onboarding.findDetailedBySlug(slug);
    if (!business) throw new PublicBusinessNotFoundError();
    return business;
  }

  async #client(userId, input) {
    const existing = await this.clients.findByPhone(userId, input.clientPhone);
    if (existing) return existing;
    return Client.create({
      userId,
      name: input.clientName,
      phone: input.clientPhone,
    });
  }
}

function readOverrides(raw) {
  let value = raw;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch (_) {
      return {};
    }
  }
  return normalizeOverrides(value);
}

function dateOnly(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${value.getUTCFullYear()}-${month}-${day}`;
  }
  return null;
}

function weekdayOf(day) {
  const [year, month, date] = day.split('-').map(Number);
  return WEEKDAYS[new Date(year, month - 1, date).getDay()];
}

function rangesOn(business, day) {
  const until = dateOnly(business.openUntil);
  if (until && day > until) return [];
  const overrides = readOverrides(business.dayOverrides);
  if (Object.prototype.hasOwnProperty.call(overrides, day)) {
    return overrides[day];
  }
  const weekday = weekdayOf(day);
  const row = (business.hours ?? []).find((item) => item.weekday === weekday);
  return normalizeRanges(row?.slots);
}

function slotFits(slot, durationMinutes, ranges) {
  if (!durationMinutes || durationMinutes <= 0) return false;
  const start = parseMinutes(slot);
  const finish = start + durationMinutes;
  return ranges.some((range) => {
    const rangeStart = parseMinutes(range.start);
    const rangeEnd = parseMinutes(range.end);
    return start >= rangeStart && finish <= rangeEnd;
  });
}

function isPast(day, slot, now = new Date()) {
  const [year, month, date] = day.split('-').map(Number);
  const [hours, minutes] = slot.split(':').map(Number);
  return new Date(year, month - 1, date, hours, minutes).getTime() < now.getTime();
}

module.exports = { PublicService };
