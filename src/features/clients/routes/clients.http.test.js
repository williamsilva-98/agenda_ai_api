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

function futureDay(monthsAhead = 2) {
  const date = new Date();
  date.setMonth(date.getMonth() + monthsAhead);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

  it('pesquisa clientes pelo nome depois de 3 letras', async () => {
    const token = await authenticatedUser(app, 'clients-search@gmail.com');

    const maria = await request(app)
      .post('/v1/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Maria Santos', phone: '11992345678' });
    const ana = await request(app)
      .post('/v1/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ana Lima', phone: '11987654321' });
    expect(maria.status).toBe(201);
    expect(ana.status).toBe(201);

    const shortQuery = await request(app)
      .get('/v1/clients')
      .query({ q: 'ma' })
      .set('Authorization', `Bearer ${token}`);
    expect(shortQuery.status).toBe(200);
    expect(shortQuery.body.clients).toHaveLength(2);

    const search = await request(app)
      .get('/v1/clients')
      .query({ q: 'mar' })
      .set('Authorization', `Bearer ${token}`);
    expect(search.status).toBe(200);
    expect(search.body.clients.map((client) => client.name)).toEqual([
      'Maria Santos',
    ]);
  });

  it('pesquisa por nome, e-mail ou telefone', async () => {
    const token = await authenticatedUser(app, 'clients-search-fields@gmail.com');

    const maria = await request(app)
      .post('/v1/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Maria Santos',
        phone: '11992345678',
        email: 'maria@gmail.com',
      });
    const ana = await request(app)
      .post('/v1/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Ana Lima',
        phone: '47988887777',
        email: 'ana@outlook.com',
      });
    expect(maria.status).toBe(201);
    expect(ana.status).toBe(201);

    const byEmail = await request(app)
      .get('/v1/clients')
      .query({ q: 'outlook' })
      .set('Authorization', `Bearer ${token}`);
    expect(byEmail.status).toBe(200);
    expect(byEmail.body.clients.map((client) => client.name)).toEqual([
      'Ana Lima',
    ]);

    const byPhone = await request(app)
      .get('/v1/clients')
      .query({ q: '99234' })
      .set('Authorization', `Bearer ${token}`);
    expect(byPhone.body.clients.map((client) => client.name)).toEqual([
      'Maria Santos',
    ]);

    const byFormattedPhone = await request(app)
      .get('/v1/clients')
      .query({ q: '(47) 98888' })
      .set('Authorization', `Bearer ${token}`);
    expect(byFormattedPhone.body.clients.map((client) => client.name)).toEqual([
      'Ana Lima',
    ]);
  });

  it('lista os clientes mais frequentes', async () => {
    const token = await authenticatedUser(app, 'clients-frequent@gmail.com');
    const day = futureDay();

    const maria = await request(app)
      .post('/v1/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Maria Santos', phone: '11992345678' });
    const joao = await request(app)
      .post('/v1/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'João Pereira', phone: '11987654321' });
    const ana = await request(app)
      .post('/v1/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ana Lima', phone: '47988887777' });
    expect(maria.status).toBe(201);
    expect(joao.status).toBe(201);
    expect(ana.status).toBe(201);

    const first = await request(app)
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: maria.body.id,
        serviceId: 'corte',
        serviceName: 'Corte',
        day,
        slot: '10:00',
        durationMinutes: 60,
        priceCents: 8000,
      });
    const second = await request(app)
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: maria.body.id,
        serviceId: 'corte',
        serviceName: 'Corte',
        day,
        slot: '14:00',
        durationMinutes: 60,
        priceCents: 8000,
      });
    const third = await request(app)
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: joao.body.id,
        serviceId: 'barba',
        serviceName: 'Barba',
        day,
        slot: '16:00',
        durationMinutes: 30,
        priceCents: 4500,
      });
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    expect(third.status).toBe(201);

    const frequent = await request(app)
      .get('/v1/clients')
      .query({ frequent: 10 })
      .set('Authorization', `Bearer ${token}`);
    expect(frequent.status).toBe(200);
    expect(frequent.body.clients.map((client) => client.name)).toEqual([
      'Maria Santos',
      'João Pereira',
      'Ana Lima',
    ]);
    expect(frequent.body.clients.map((client) => client.visits)).toEqual([
      2, 1, 0,
    ]);

    const top = await request(app)
      .get('/v1/clients')
      .query({ frequent: 2 })
      .set('Authorization', `Bearer ${token}`);
    expect(top.body.clients.map((client) => client.name)).toEqual([
      'Maria Santos',
      'João Pereira',
    ]);

    const full = await request(app)
      .get('/v1/clients')
      .set('Authorization', `Bearer ${token}`);
    expect(full.body.clients).toHaveLength(3);
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
