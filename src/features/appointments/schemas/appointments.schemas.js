const { z } = require('zod');

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
  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => value ?? ''),
});

module.exports = { appointmentBodySchema };
