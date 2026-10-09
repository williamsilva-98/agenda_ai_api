const { z } = require('zod');

const daySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida');

const availabilityQuerySchema = z.object({
  day: daySchema,
});

const bookingBodySchema = z.object({
  clientName: z.string().trim().min(2, 'O nome precisa ter pelo menos 2 letras'),
  clientPhone: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ''))
    .refine(
      (value) => value.length >= 10 && value.length <= 11,
      'Telefone inválido',
    ),
  serviceId: z.string().trim().min(1),
  day: daySchema,
  slot: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
});

module.exports = { availabilityQuerySchema, bookingBodySchema };
