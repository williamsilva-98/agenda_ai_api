const { z } = require('zod');

const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => value ?? '');

const clientBodySchema = z
  .object({
    name: z.string().trim().min(2, 'O nome precisa ter pelo menos 2 letras'),
    phone: z
      .string()
      .trim()
      .transform((value) => value.replace(/\D/g, ''))
      .refine(
        (value) => value.length >= 10 && value.length <= 11,
        'Telefone inválido',
      ),
    email: z
      .string()
      .trim()
      .optional()
      .transform((value) => value ?? '')
      .refine(
        (value) =>
          value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        'E-mail inválido',
      ),
    cep: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ?? '').replace(/\D/g, ''))
      .refine(
        (value) => value === '' || value.length === 8,
        'CEP inválido',
      ),
    street: optionalText(160),
    number: optionalText(20),
    complement: optionalText(120),
    neighborhood: optionalText(120),
    city: optionalText(120),
    stateCode: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ?? '').toUpperCase())
      .refine(
        (value) => value === '' || /^[A-Z]{2}$/.test(value),
        'UF inválida',
      ),
    notes: optionalText(500),
  })
  .superRefine((data, ctx) => {
    const started =
      data.cep !== '' ||
      data.street !== '' ||
      data.number !== '' ||
      data.neighborhood !== '' ||
      data.city !== '' ||
      data.stateCode !== '';

    if (!started) return;

    const required = [
      ['street', data.street, 'Informe a rua'],
      ['number', data.number, 'Informe o número'],
      ['neighborhood', data.neighborhood, 'Informe o bairro'],
      ['city', data.city, 'Informe a cidade'],
      ['stateCode', data.stateCode, 'Informe a UF'],
    ];

    for (const [path, value, message] of required) {
      if (!value) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: [path] });
      }
    }

    if (data.cep && data.cep.length !== 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'CEP inválido',
        path: ['cep'],
      });
    }
  });

module.exports = { clientBodySchema };
