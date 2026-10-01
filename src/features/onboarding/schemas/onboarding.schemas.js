const { z } = require('zod');

const { CATEGORIES, WEEKDAYS } = require('../models/onboarding.models');

const hourSlot = z.string().regex(/^\d{2}:\d{2}$/, 'Horário inválido');

const timeRangeSchema = z
  .object({
    start: hourSlot,
    end: hourSlot,
  })
  .refine((range) => range.start < range.end, {
    message: 'O horário final deve ser depois do inicial.',
  });

const serviceSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(2, 'Informe o nome do serviço'),
  durationMinutes: z.number().int().positive(),
  priceCents: z.number().int().nonnegative(),
  selected: z.boolean().default(true),
});

const hoursSchema = z
  .record(z.enum(WEEKDAYS), z.array(timeRangeSchema))
  .default({});

const onboardingBodySchema = z.object({
  category: z.enum(CATEGORIES),
  name: z.string().trim().min(2, 'O nome precisa ter pelo menos 2 letras'),
  city: z.string().trim().min(2, 'Informe a cidade'),
  whatsapp: z
    .string()
    .trim()
    .default('')
    .transform((value) => value.replace(/\D/g, ''))
    .refine(
      (value) => value === '' || (value.length >= 10 && value.length <= 11),
      'WhatsApp inválido',
    ),
  photoUrl: z.string().url().nullable().optional(),
  services: z.array(serviceSchema).default([]),
  hours: hoursSchema,
});

module.exports = {
  onboardingBodySchema,
  timeRangeSchema,
};
