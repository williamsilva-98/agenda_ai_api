const {
  OnboardingIncompleteError,
  OnboardingNotFoundError,
} = require('../errors/onboarding.errors');
const { WEEKDAYS } = require('../models/onboarding.models');
const { normalizeOverrides, normalizeRanges } = require('./hours');
const { bookingSlug } = require('./slug');

class OnboardingService {
  constructor(repository) {
    this.repository = repository;
  }

  async get(userId) {
    const business = await this.repository.findByUserId(userId);
    if (!business) {
      throw new OnboardingNotFoundError();
    }
    return this.toDto(business);
  }

  async save(userId, input, { complete = false } = {}) {
    if (complete) {
      this.assertCompletable(input);
    }

    const slug = await this.resolveSlug(input.name, userId);
    const business = await this.repository.upsertBusiness(userId, {
      category: input.category,
      name: input.name.trim(),
      city: input.city.trim(),
      whatsapp: input.whatsapp ?? '',
      slug,
      photoUrl: input.photoUrl ?? null,
      ...(complete ? { completedAt: new Date() } : {}),
      ...(input.openUntil !== undefined ? { openUntil: input.openUntil } : {}),
      ...(input.dayOverrides !== undefined
        ? { dayOverrides: normalizeOverrides(input.dayOverrides) }
        : {}),
    });

    await this.repository.replaceServices(business.id, input.services ?? []);
    await this.repository.replaceHours(business.id, input.hours ?? {});

    const fresh = await this.repository.findByUserId(userId);
    return this.toDto(fresh);
  }

  async complete(userId, input) {
    return this.save(userId, input, { complete: true });
  }

  assertCompletable(input) {
    if (!input.category || !input.name?.trim() || !input.city?.trim()) {
      throw new OnboardingIncompleteError();
    }
    const selected = (input.services ?? []).filter((service) => service.selected);
    if (!selected.length) {
      throw new OnboardingIncompleteError(
        'Selecione pelo menos um serviço para finalizar.',
      );
    }
    const hasHours = Object.values(input.hours ?? {}).some(
      (ranges) => Array.isArray(ranges) && ranges.length > 0,
    );
    if (!hasHours) {
      throw new OnboardingIncompleteError(
        'Informe pelo menos um dia de atendimento.',
      );
    }
  }

  async resolveSlug(name, userId) {
    const base = bookingSlug(name);
    const current = await this.repository.findByUserId(userId);
    let candidate = base;
    let suffix = 1;

    while (true) {
      const conflict = await this.repository.findBySlug(candidate, {
        excludeBusinessId: current?.id,
      });
      if (!conflict) return candidate;
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
  }

  toDto(business) {
    const hours = Object.fromEntries(WEEKDAYS.map((day) => [day, []]));
    for (const row of business.hours ?? []) {
      hours[row.weekday] = normalizeRanges(row.slots);
    }

    const services = [...(business.services ?? [])]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((service) => ({
        id: service.clientKey,
        name: service.name,
        durationMinutes: service.durationMinutes,
        priceCents: service.priceCents,
        selected: service.selected,
      }));

    return {
      category: business.category,
      name: business.name,
      city: business.city,
      whatsapp: business.whatsapp,
      photoUrl: business.photoUrl,
      slug: business.slug,
      bookingLink: `agendaai.app/${business.slug}`,
      completed: Boolean(business.completedAt),
      completedAt: business.completedAt
        ? business.completedAt.toISOString()
        : null,
      services,
      hours,
      openUntil: dateOnlyValue(business.openUntil),
      dayOverrides: normalizeOverrides(business.dayOverrides),
    };
  }
}

function dateOnlyValue(value) {
  if (!value) return null;
  if (typeof value === 'string') return value.slice(0, 10);
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const month = String(value.getUTCMonth() + 1).padStart(2, '0');
    const day = String(value.getUTCDate()).padStart(2, '0');
    return `${value.getUTCFullYear()}-${month}-${day}`;
  }
  return null;
}

module.exports = { OnboardingService };
