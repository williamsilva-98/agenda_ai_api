const { Op } = require('sequelize');

const {
  Business,
  BusinessHour,
  BusinessService,
  WEEKDAYS,
} = require('../models/onboarding.models');

class OnboardingRepository {
  findByUserId(userId) {
    return Business.findOne({
      where: { userId },
      include: [
        { model: BusinessService, as: 'services' },
        { model: BusinessHour, as: 'hours' },
      ],
      order: [
        [{ model: BusinessService, as: 'services' }, 'sortOrder', 'ASC'],
        [{ model: BusinessHour, as: 'hours' }, 'weekday', 'ASC'],
      ],
    });
  }

  findBySlug(slug, { excludeBusinessId } = {}) {
    return Business.findOne({
      where: {
        slug,
        ...(excludeBusinessId
          ? { id: { [Op.ne]: excludeBusinessId } }
          : {}),
      },
    });
  }

  async upsertBusiness(userId, data) {
    const existing = await Business.findOne({ where: { userId } });
    if (existing) {
      await existing.update(data);
      return existing;
    }
    return Business.create({ userId, ...data });
  }

  async replaceServices(businessId, services) {
    await BusinessService.destroy({ where: { businessId } });
    if (!services.length) return [];

    return BusinessService.bulkCreate(
      services.map((service, index) => ({
        businessId,
        clientKey: service.id,
        name: service.name,
        durationMinutes: service.durationMinutes,
        priceCents: service.priceCents,
        selected: service.selected,
        sortOrder: index,
      })),
    );
  }

  async replaceHours(businessId, hours) {
    await BusinessHour.destroy({ where: { businessId } });
    const rows = WEEKDAYS
      .map((weekday) => ({
        businessId,
        weekday,
        slots: Array.isArray(hours[weekday]) ? hours[weekday] : [],
      }))
      .filter((row) => Array.isArray(row.slots) && row.slots.length > 0);

    if (!rows.length) return [];
    return BusinessHour.bulkCreate(rows);
  }
}

module.exports = { OnboardingRepository };
