const { z } = require('zod');

const serviceLineSchema = z.object({
  serviceId: z.string().trim().min(1, 'Informe o serviço'),
  serviceName: z.string().trim().min(1, 'Informe o serviço'),
  durationMinutes: z.coerce.number().int().positive().max(24 * 60),
  priceCents: z.coerce.number().int().min(0),
});

const appointmentBodySchema = z.object({
  clientId: z.string().uuid('Cliente inválido'),
  serviceId: z.string().trim().min(1, 'Informe o serviço'),
  serviceName: z.string().trim().min(1, 'Informe o serviço'),
  day: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  slot: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
  durationMinutes: z.coerce.number().int().positive().max(24 * 60),
  priceCents: z.coerce.number().int().min(0),
  services: z.array(serviceLineSchema).min(1).optional(),
  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => value ?? ''),
});

const cancelBodySchema = z.object({
  reason: z.enum([
    'client_cancelled',
    'client_no_show',
    'professional_unavailable',
    'reschedule',
    'service_dropped',
  ]),
});

module.exports = { appointmentBodySchema, cancelBodySchema };
