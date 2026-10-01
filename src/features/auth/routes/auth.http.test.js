const request = require('supertest');

const { createApp } = require('../../../app');

describe('Auth HTTP', () => {
  const app = createApp();

  it('fluxo HTTP de cadastro e login', async () => {
    const signup = await request(app).post('/v1/auth/sign-up').send({
      name: 'Maria Santos',
      email: 'maria@gmail.com',
      password: 'Abcdefg1!',
    });
    expect(signup.status).toBe(201);
    expect(signup.body.code).toHaveLength(6);

    const verify = await request(app).post('/v1/auth/verify-email').send({
      email: 'maria@gmail.com',
      code: signup.body.code,
    });
    expect(verify.status).toBe(200);
    expect(verify.body.user.email).toBe('maria@gmail.com');
    expect(verify.body.accessToken).toBeTruthy();

    const login = await request(app).post('/v1/auth/sign-in').send({
      email: 'maria@gmail.com',
      password: 'Abcdefg1!',
    });
    expect(login.status).toBe(200);
    expect(login.body.user.name).toBe('Maria Santos');
  });

  it('login inválido retorna 401', async () => {
    const response = await request(app).post('/v1/auth/sign-in').send({
      email: 'x@gmail.com',
      password: 'errada',
    });
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});
