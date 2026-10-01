const request = require('supertest');

const { createApp } = require('../../../app');

async function authenticatedUser(app, email) {
  const signup = await request(app).post('/v1/auth/sign-up').send({
    name: 'Profissional Clientes',
    email,
    password: 'Abcdefg1!',
  });
  expect(signup.status).toBe(201);

  const verify = await request(app).post('/v1/auth/verify-email').send({
    email,
    code: signup.body.code,
  });
  expect(verify.status).toBe(200);
  return verify.body.accessToken;
}

describe('Clients HTTP', () => {
  const app = createApp();

  it('exige JWT', async () => {
    const response = await request(app).get('/v1/clients');
    expect(response.status).toBe(401);
  });

  it('cadastra e lista clientes', async () => {
    const token = await authenticatedUser(app, 'clients-http@gmail.com');

    const create = await request(app)
      .post('/v1/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Maria Santos',
        phone: '(11) 99234-5678',
        email: 'maria@gmail.com',
        cep: '01001000',
        street: 'Praça da Sé',
        number: '100',
        complement: 'lado ímpar',
        neighborhood: 'Sé',
        city: 'São Paulo',
        stateCode: 'SP',
        notes: 'Prefere horários de manhã',
      });

    expect(create.status).toBe(201);
    expect(create.body.name).toBe('Maria Santos');
    expect(create.body.phone).toBe('11992345678');
    expect(create.body.notes).toBe('Prefere horários de manhã');
    expect(create.body.place).toBe('São Paulo — SP');

    const list = await request(app)
      .get('/v1/clients')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.clients).toHaveLength(1);
    expect(list.body.clients[0].id).toBe(create.body.id);

    const detail = await request(app)
      .get(`/v1/clients/${create.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(detail.status).toBe(200);
    expect(detail.body.id).toBe(create.body.id);
    expect(detail.body.email).toBe('maria@gmail.com');
    expect(detail.body.street).toBe('Praça da Sé');
    expect(detail.body.notes).toBe('Prefere horários de manhã');

    const missing = await request(app)
      .get('/v1/clients/00000000-0000-4000-8000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('CLIENT_NOT_FOUND');
  });

  it('permite cadastro só com nome e telefone', async () => {
    const token = await authenticatedUser(app, 'clients-min@gmail.com');
    const response = await request(app)
      .post('/v1/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'João Silva',
        phone: '47999998888',
      });

    expect(response.status).toBe(201);
    expect(response.body.city).toBe('');
    expect(response.body.street).toBe('');
  });

  it('bloqueia telefone duplicado do mesmo profissional', async () => {
    const token = await authenticatedUser(app, 'clients-dup@gmail.com');
    const payload = {
      name: 'Ana',
      phone: '11988887777',
    };

    const first = await request(app)
      .post('/v1/clients')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/v1/clients')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('CLIENT_PHONE_IN_USE');
  });
});
