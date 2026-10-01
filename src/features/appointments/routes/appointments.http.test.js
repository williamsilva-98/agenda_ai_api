const request = require('supertest');

const { createApp } = require('../../../app');

async function authenticatedUser(app, email) {
  const signup = await request(app).post('/v1/auth/sign-up').send({
    name: 'Profissional Agenda',
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

describe('Appointments HTTP', () => {
  const app = createApp();

  it('cadastra e lista agendamentos do dia', async () => {
    const token = await authenticatedUser(app, 'appointments-http@gmail.com');

    const client = await request(app)
      .post('/v1/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Maria Santos',
        phone: '11992345678',
      });
    expect(client.status).toBe(201);

    const create = await request(app)
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: client.body.id,
        serviceId: 'sessao',
        serviceName: 'Sessão',
        day: '2026-10-01',
        slot: '14:00',
        durationMinutes: 120,
        priceCents: 15000,
        notes: 'Primeira sessão',
      });

    expect(create.status).toBe(201);
    expect(create.body.slot).toBe('14:00');
    expect(create.body.durationMinutes).toBe(120);
    expect(create.body.status).toBe('scheduled');
    expect(create.body.completed).toBe(false);

    const complete = await request(app)
      .post(`/v1/appointments/${create.body.id}/complete`)
      .set('Authorization', `Bearer ${token}`);
    expect(complete.status).toBe(200);
    expect(complete.body.status).toBe('completed');
    expect(complete.body.completed).toBe(true);

    const conflict = await request(app)
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: client.body.id,
        serviceId: 'retouch',
        serviceName: 'Retoque',
        day: '2026-10-01',
        slot: '15:00',
        durationMinutes: 60,
        priceCents: 8000,
      });
    expect(conflict.status).toBe(409);
    expect(conflict.body.error.code).toBe('APPOINTMENT_SLOT_TAKEN');

    const list = await request(app)
      .get('/v1/appointments')
      .query({ day: '2026-10-01' })
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.appointments).toHaveLength(1);

    const fromList = await request(app)
      .get('/v1/appointments')
      .query({ from: '2026-09-01' })
      .set('Authorization', `Bearer ${token}`);
    expect(fromList.status).toBe(200);
    expect(fromList.body.appointments).toHaveLength(1);

    const insights = await request(app)
      .get('/v1/appointments/insights')
      .query({ period: 'month', anchor: '2026-10-01' })
      .set('Authorization', `Bearer ${token}`);
    expect(insights.status).toBe(200);
    expect(insights.body.period).toBe('month');
    expect(insights.body.completedCount).toBe(1);
    expect(insights.body.revenueCents).toBe(15000);
    expect(insights.body.series).toEqual(expect.any(Array));
  });
});
