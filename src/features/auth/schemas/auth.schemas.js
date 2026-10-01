const { z } = require('zod');

const email = z
  .string()
  .trim()
  .email('E-mail inválido')
  .transform((value) => value.toLowerCase());

const password = z.string().min(1, 'Informe a senha');
const strongPassword = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres');
const otp = z.string().regex(/^\d{6}$/, 'Código inválido');

const signUpSchema = z.object({
  name: z.string().trim().min(2, 'O nome precisa ter pelo menos 2 letras'),
  email,
  password: strongPassword,
});

const verifyEmailSchema = z.object({
  email,
  code: otp,
});

const resendCodeSchema = z.object({
  email,
});

const signInSchema = z.object({
  email,
  password,
});

const forgotPasswordSchema = z.object({
  email,
});

const resetPasswordSchema = z.object({
  email,
  code: otp,
  password: strongPassword,
});

module.exports = {
  signUpSchema,
  verifyEmailSchema,
  resendCodeSchema,
  signInSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
