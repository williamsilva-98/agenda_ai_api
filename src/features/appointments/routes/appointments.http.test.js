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

function futureDay(monthsAhead = 2) {
  const date = new Date();
  date.setMonth(date.getMonth() + monthsAhead);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function monthBounds(day) {
  const [year, month] = day.split('-').map(Number);
  const last = new Date(year, month, 0).getDate();
  const key = String(month).padStart(2, '0');
  const previous = new Date(year, month - 2, 1);
  const previousYear = previous.getFullYear();
  const previousMonth = String(previous.getMonth() + 1).padStart(2, '0');
  const previousLast = new Date(previousYear, previous.getMonth() + 1, 0).getDate();
  return {
    from: `${year}-${key}-01`,
    to: `${year}-${key}-${String(last).padStart(2, '0')}`,
    otherFrom: `${previousYear}-${previousMonth}-01`,
    otherTo: `${previousYear}-${previousMonth}-${String(previousLast).padStart(2, '0')}`,
  };
}

describe('Appointments HTTP', () => {
  const app = createApp();

  it('cadastra e lista agendamentos do dia', async () => {
    const token = await authenticatedUser(app, 'appointments-http@gmail.com');

    const before = await request(app)
      .get('/v1/appointments')
      .query({ exists: '1' })
      .set('Authorization', `Bearer ${token}`);
    expect(before.status).toBe(200);
    expect(before.body.hasAppointments).toBe(false);

    const day = futureDay();
    const bounds = monthBounds(day);

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
        day,
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
        day,
        slot: '15:00',
        durationMinutes: 60,
        priceCents: 8000,
      });
    expect(conflict.status).toBe(409);
    expect(conflict.body.error.code).toBe('APPOINTMENT_SLOT_TAKEN');

    const list = await request(app)
      .get('/v1/appointments')
      .query({ day })
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.appointments).toHaveLength(1);

    const after = await request(app)
      .get('/v1/appointments')
      .query({ exists: '1' })
      .set('Authorization', `Bearer ${token}`);
    expect(after.status).toBe(200);
    expect(after.body.hasAppointments).toBe(true);

    const fromList = await request(app)
      .get('/v1/appointments')
      .query({ from: bounds.otherFrom })
      .set('Authorization', `Bearer ${token}`);
    expect(fromList.status).toBe(200);
    expect(fromList.body.appointments).toHaveLength(1);

    const monthList = await request(app)
      .get('/v1/appointments')
      .query({ from: bounds.from, to: bounds.to })
      .set('Authorization', `Bearer ${token}`);
    expect(monthList.status).toBe(200);
    expect(monthList.body.appointments).toHaveLength(1);

    const otherMonth = await request(app)
      .get('/v1/appointments')
      .query({ from: bounds.otherFrom, to: bounds.otherTo })
      .set('Authorization', `Bearer ${token}`);
    expect(otherMonth.status).toBe(200);
    expect(otherMonth.body.appointments).toHaveLength(0);

    const insights = await request(app)
      .get('/v1/appointments/insights')
      .query({ period: 'month', anchor: day })
      .set('Authorization', `Bearer ${token}`);
    expect(insights.status).toBe(200);
    expect(insights.body.period).toBe('month');
    expect(insights.body.completedCount).toBe(1);
    expect(insights.body.revenueCents).toBe(15000);
    expect(insights.body.series).toEqual(expect.any(Array));
  });

  it('aceita vários serviços no mesmo horário e bloqueia só o mais longo', async () => {
    const token = await authenticatedUser(app, 'appointments-multi@gmail.com');
    const day = futureDay(3);

    const client = await request(app)
      .post('/v1/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Ana Lima',
        phone: '11987654321',
      });
    expect(client.status).toBe(201);

    const create = await request(app)
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: client.body.id,
        serviceId: 'coloracao',
        serviceName: 'Coloração',
        day,
        slot: '14:00',
        durationMinutes: 120,
        priceCents: 18000,
        services: [
          {
            serviceId: 'coloracao',
            serviceName: 'Coloração',
            durationMinutes: 120,
            priceCents: 18000,
          },
          {
            serviceId: 'unha',
            serviceName: 'Unha',
            durationMinutes: 45,
            priceCents: 5000,
          },
        ],
      });

    expect(create.status).toBe(201);
    expect(create.body.durationMinutes).toBe(120);
    expect(create.body.priceCents).toBe(23000);
    expect(create.body.serviceName).toBe('Coloração · Unha');
    expect(create.body.services).toHaveLength(2);

    const during = await request(app)
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: client.body.id,
        serviceId: 'corte',
        serviceName: 'Corte',
        day,
        slot: '15:00',
        durationMinutes: 30,
        priceCents: 4000,
      });
    expect(during.status).toBe(409);

    const after = await request(app)
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: client.body.id,
        serviceId: 'corte',
        serviceName: 'Corte',
        day,
        slot: '16:00',
        durationMinutes: 30,
        priceCents: 4000,
      });
    expect(after.status).toBe(201);
  });

  it('cancela o agendamento, guarda o motivo e libera o horário', async () => {
    const token = await authenticatedUser(app, 'appointments-cancel@gmail.com');
    const day = futureDay();

    const client = await request(app)
      .post('/v1/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'João Lima', phone: '47988880000' });
    expect(client.status).toBe(201);

    const create = await request(app)
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: client.body.id,
        serviceId: 'corte',
        serviceName: 'Corte',
        day,
        slot: '11:00',
        durationMinutes: 60,
        priceCents: 8000,
      });
    expect(create.status).toBe(201);

    const missing = await request(app)
      .post(`/v1/appointments/${create.body.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(missing.status).toBe(400);

    const cancel = await request(app)
      .post(`/v1/appointments/${create.body.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'client_cancelled' });
    expect(cancel.status).toBe(200);
    expect(cancel.body.status).toBe('cancelled');
    expect(cancel.body.cancelReason).toBe('client_cancelled');
    expect(cancel.body.completed).toBe(false);

    const again = await request(app)
      .post(`/v1/appointments/${create.body.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'client_no_show' });
    expect(again.status).toBe(409);

    const rebook = await request(app)
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: client.body.id,
        serviceId: 'barba',
        serviceName: 'Barba',
        day,
        slot: '11:00',
        durationMinutes: 30,
        priceCents: 4000,
      });
    expect(rebook.status).toBe(201);

    const past = await request(app)
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: client.body.id,
        serviceId: 'corte',
        serviceName: 'Corte',
        day: '2026-01-10',
        slot: '09:00',
        durationMinutes: 30,
        priceCents: 5000,
      });
    expect(past.status).toBe(201);

    const pastCancel = await request(app)
      .post(`/v1/appointments/${past.body.id}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'client_no_show' });
    expect(pastCancel.status).toBe(200);

    const listed = await request(app)
      .get('/v1/appointments')
      .query({ day: '2026-01-10' })
      .set('Authorization', `Bearer ${token}`);
    expect(listed.status).toBe(200);
    expect(listed.body.appointments).toHaveLength(1);
    expect(listed.body.appointments[0].status).toBe('cancelled');
    expect(listed.body.appointments[0].completed).toBe(false);
    expect(listed.body.appointments[0].cancelReason).toBe('client_no_show');
  });

  it('lista o histórico de um cliente, inclusive o passado', async () => {
    const token = await authenticatedUser(app, 'appointments-client@gmail.com');
    const day = futureDay();

    const client = await request(app)
      .post('/v1/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ana Costa', phone: '47977770000' });
    expect(client.status).toBe(201);

    const other = await request(app)
      .post('/v1/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bruno Dias', phone: '47966660000' });
    expect(other.status).toBe(201);

    const past = await request(app)
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: client.body.id,
        serviceId: 'corte',
        serviceName: 'Corte',
        day: '2026-01-10',
        slot: '09:00',
        durationMinutes: 30,
        priceCents: 5000,
      });
    expect(past.status).toBe(201);

    const upcoming = await request(app)
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: client.body.id,
        serviceId: 'barba',
        serviceName: 'Barba',
        day,
        slot: '15:00',
        durationMinutes: 30,
        priceCents: 4000,
      });
    expect(upcoming.status).toBe(201);

    await request(app)
      .post('/v1/appointments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        clientId: other.body.id,
        serviceId: 'corte',
        serviceName: 'Corte',
        day,
        slot: '16:00',
        durationMinutes: 30,
        priceCents: 5000,
      });

    const listed = await request(app)
      .get('/v1/appointments')
      .query({ clientId: client.body.id })
      .set('Authorization', `Bearer ${token}`);
    expect(listed.status).toBe(200);
    expect(listed.body.appointments).toHaveLength(2);
    expect(listed.body.appointments.map((item) => item.serviceName)).toEqual([
      'Barba',
      'Corte',
    ]);
  });
});
