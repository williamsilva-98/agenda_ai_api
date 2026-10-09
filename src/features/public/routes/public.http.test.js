const request = require('supertest');

const { createApp } = require('../../../app');

async function authenticatedUser(app, email) {
  const signup = await request(app).post('/v1/auth/sign-up').send({
    name: 'Profissional HTTP',
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

describe('Agendamento público', () => {
  const app = createApp();

  const business = {
    category: 'fitness',
    name: 'Box Fit',
    city: 'Campinas',
    whatsapp: '11988887777',
    services: [
      {
        id: 'personal',
        name: 'Personal 1h',
        durationMinutes: 60,
        priceCents: 12000,
        selected: true,
      },
      {
        id: 'oculto',
        name: 'Avulso',
        durationMinutes: 30,
        priceCents: 5000,
        selected: false,
      },
    ],
    hours: {
      monday: [{ start: '07:00', end: '12:00' }],
    },
    openUntil: '2028-01-31',
  };

  async function saveBusiness(email) {
    const token = await authenticatedUser(app, email);
    const save = await request(app)
      .put('/v1/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send(business);
    expect(save.status).toBe(200);
    return token;
  }

  it('abre o negócio pelo slug sem login', async () => {
    await saveBusiness('public-page@gmail.com');

    const response = await request(app).get('/v1/public/box-fit');

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Box Fit');
    expect(response.body.slug).toBe('box-fit');
    expect(response.body.subtitle).toBe('Fitness · Campinas');
    expect(response.body.services).toEqual([
      {
        id: 'personal',
        name: 'Personal 1h',
        durationMinutes: 60,
        priceCents: 12000,
      },
    ]);
    expect(response.body.hours.monday).toEqual([
      { start: '07:00', end: '12:00' },
    ]);
  });

  it('responde 404 quando o slug não existe', async () => {
    const response = await request(app).get('/v1/public/nao-existe');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('PUBLIC_BUSINESS_NOT_FOUND');
  });

  it('marca um horário livre e ocupa a agenda do negócio', async () => {
    const token = await saveBusiness('public-book@gmail.com');

    const created = await request(app).post('/v1/public/box-fit/bookings').send({
      clientName: 'Carla Souza',
      clientPhone: '(19) 98888-0000',
      serviceId: 'personal',
      day: '2026-10-12',
      slot: '08:00',
    });

    expect(created.status).toBe(201);
    expect(created.body.clientName).toBe('Carla Souza');
    expect(created.body.slot).toBe('08:00');
    expect(created.body.serviceName).toBe('Personal 1h');

    const availability = await request(app).get(
      '/v1/public/box-fit/availability?day=2026-10-12',
    );
    expect(availability.status).toBe(200);
    expect(availability.body.occupied).toEqual([
      { slot: '08:00', durationMinutes: 60 },
    ]);

    const agenda = await request(app)
      .get('/v1/appointments?day=2026-10-12')
      .set('Authorization', `Bearer ${token}`);
    expect(agenda.status).toBe(200);
    expect(agenda.body.appointments).toHaveLength(1);
    expect(agenda.body.appointments[0].clientName).toBe('Carla Souza');

    const conflict = await request(app).post('/v1/public/box-fit/bookings').send({
      clientName: 'Outra Pessoa',
      clientPhone: '19977776666',
      serviceId: 'personal',
      day: '2026-10-12',
      slot: '08:30',
    });
    expect(conflict.status).toBe(409);
  });
});
