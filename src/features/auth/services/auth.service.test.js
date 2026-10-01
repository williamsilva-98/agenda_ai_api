const { AuthCode } = require('../models/auth.models');
const { AuthRepository } = require('../repositories/auth.repository');
const { AuthService } = require('./auth.service');

describe('AuthService', () => {
  const repository = new AuthRepository();
  const service = new AuthService(repository);

  it('cadastra, verifica e faz login', async () => {
    const signup = await service.signUp({
      name: 'Lucas Mendes',
      email: 'lucas@gmail.com',
      password: 'Abcdefg1!',
    });
    expect(signup.email).toBe('lucas@gmail.com');
    expect(signup.code).toHaveLength(6);

    const session = await service.verifyEmail({
      email: 'lucas@gmail.com',
      code: signup.code,
    });
    expect(session.user.name).toBe('Lucas Mendes');
    expect(session.accessToken).toBeTruthy();

    const login = await service.signIn({
      email: 'lucas@gmail.com',
      password: 'Abcdefg1!',
    });
    expect(login.user.email).toBe('lucas@gmail.com');
  });

  it('rejeita e-mail já ativo', async () => {
    const signup = await service.signUp({
      name: 'Lucas',
      email: 'dup@gmail.com',
      password: 'Abcdefg1!',
    });
    await service.verifyEmail({ email: 'dup@gmail.com', code: signup.code });

    await expect(
      service.signUp({
        name: 'Outro',
        email: 'dup@gmail.com',
        password: 'Abcdefg1!',
      }),
    ).rejects.toMatchObject({ code: 'EMAIL_IN_USE' });
  });

  it('rejeita código 000000 e código inválido', async () => {
    await service.signUp({
      name: 'Ana',
      email: 'ana@gmail.com',
      password: 'Abcdefg1!',
    });

    await expect(
      service.verifyEmail({ email: 'ana@gmail.com', code: '000000' }),
    ).rejects.toMatchObject({ code: 'INVALID_OTP' });

    await expect(
      service.verifyEmail({ email: 'ana@gmail.com', code: '111111' }),
    ).rejects.toMatchObject({ code: 'INVALID_OTP' });
  });

  it('redefine a senha com código de reset', async () => {
    const signup = await service.signUp({
      name: 'João',
      email: 'joao@gmail.com',
      password: 'Abcdefg1!',
    });
    await service.verifyEmail({ email: 'joao@gmail.com', code: signup.code });

    const forgot = await service.forgotPassword({ email: 'joao@gmail.com' });
    expect(forgot.code).toHaveLength(6);

    await service.resetPassword({
      email: 'joao@gmail.com',
      code: forgot.code,
      password: 'NovaSenha1!',
    });

    await expect(
      service.signIn({ email: 'joao@gmail.com', password: 'Abcdefg1!' }),
    ).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' });

    const login = await service.signIn({
      email: 'joao@gmail.com',
      password: 'NovaSenha1!',
    });
    expect(login.user.email).toBe('joao@gmail.com');

    const codes = await AuthCode.findAll({
      where: { purpose: 'password_reset' },
    });
    expect(codes.every((row) => row.consumedAt !== null)).toBe(true);
  });
});
