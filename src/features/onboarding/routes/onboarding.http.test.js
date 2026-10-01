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

describe('Onboarding HTTP', () => {
  const app = createApp();

  const body = {
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
    ],
    hours: {
      monday: [{ start: '07:00', end: '12:00' }],
      wednesday: [{ start: '07:00', end: '11:00' }],
    },
  };

  it('exige JWT', async () => {
    const response = await request(app).get('/v1/onboarding');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  });

  it('salva, lê e finaliza onboarding', async () => {
    const token = await authenticatedUser(app, 'onb-http@gmail.com');

    const missing = await request(app)
      .get('/v1/onboarding')
      .set('Authorization', `Bearer ${token}`);
    expect(missing.status).toBe(404);

    const save = await request(app)
      .put('/v1/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send(body);
    expect(save.status).toBe(200);
    expect(save.body.slug).toBe('box-fit');
    expect(save.body.completed).toBe(false);
    expect(save.body.services[0].name).toBe('Personal 1h');

    const get = await request(app)
      .get('/v1/onboarding')
      .set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(200);
    expect(get.body.city).toBe('Campinas');
    expect(get.body.hours.monday).toEqual([{ start: '07:00', end: '12:00' }]);

    const complete = await request(app)
      .post('/v1/onboarding/complete')
      .set('Authorization', `Bearer ${token}`)
      .send(body);
    expect(complete.status).toBe(200);
    expect(complete.body.completed).toBe(true);
    expect(complete.body.bookingLink).toBe('agendaai.app/box-fit');
  });

  it('valida payload', async () => {
    const token = await authenticatedUser(app, 'onb-http-bad@gmail.com');
    const response = await request(app)
      .put('/v1/onboarding')
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'invalid', name: 'X', city: 'Y' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
