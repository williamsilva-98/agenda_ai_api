const { AuthRepository } = require('../../auth/repositories/auth.repository');
const { AuthService } = require('../../auth/services/auth.service');
const { OnboardingRepository } = require('../repositories/onboarding.repository');
const { OnboardingService } = require('./onboarding.service');

async function createVerifiedUser(email) {
  const auth = new AuthService(new AuthRepository());
  const signup = await auth.signUp({
    name: 'Profissional Teste',
    email,
    password: 'Abcdefg1!',
  });
  const session = await auth.verifyEmail({ email, code: signup.code });
  return session;
}

describe('OnboardingService', () => {
  const service = new OnboardingService(new OnboardingRepository());

  const draft = {
    category: 'beauty',
    name: 'Studio Ana',
    city: 'São Paulo',
    whatsapp: '11999998888',
    photoUrl: null,
    services: [
      {
        id: 'svc-1',
        name: 'Corte',
        durationMinutes: 45,
        priceCents: 8000,
        selected: true,
      },
      {
        id: 'svc-2',
        name: 'Escova',
        durationMinutes: 30,
        priceCents: 5000,
        selected: false,
      },
    ],
    hours: {
      monday: [{ start: '09:00', end: '18:00' }],
      tuesday: [
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '18:00' },
      ],
    },
  };

  it('salva rascunho e gera slug único', async () => {
    const session = await createVerifiedUser('onb-svc-1@gmail.com');
    const saved = await service.save(session.user.id, draft);

    expect(saved.name).toBe('Studio Ana');
    expect(saved.slug).toBe('studio-ana');
    expect(saved.bookingLink).toBe('agendax.app/studio-ana');
    expect(saved.completed).toBe(false);
    expect(saved.services).toHaveLength(2);
    expect(saved.hours.monday).toEqual([{ start: '09:00', end: '18:00' }]);
    expect(saved.hours.tuesday).toHaveLength(2);
    expect(saved.hours.sunday).toEqual([]);

    const loaded = await service.get(session.user.id);
    expect(loaded.city).toBe('São Paulo');
  });

  it('finaliza onboarding com serviço selecionado', async () => {
    const session = await createVerifiedUser('onb-svc-2@gmail.com');
    const completed = await service.complete(session.user.id, draft);

    expect(completed.completed).toBe(true);
    expect(completed.completedAt).toBeTruthy();
  });

  it('bloqueia complete sem serviço selecionado', async () => {
    const session = await createVerifiedUser('onb-svc-3@gmail.com');

    await expect(
      service.complete(session.user.id, {
        ...draft,
        services: draft.services.map((service) => ({
          ...service,
          selected: false,
        })),
      }),
    ).rejects.toMatchObject({ code: 'ONBOARDING_INCOMPLETE' });
  });

  it('retorna 404 quando onboarding não existe', async () => {
    const session = await createVerifiedUser('onb-svc-4@gmail.com');

    await expect(service.get(session.user.id)).rejects.toMatchObject({
      code: 'ONBOARDING_NOT_FOUND',
    });
  });

  it('evita colisão de slug entre usuários', async () => {
    const first = await createVerifiedUser('onb-svc-5a@gmail.com');
    const second = await createVerifiedUser('onb-svc-5b@gmail.com');

    await service.save(first.user.id, draft);
    const other = await service.save(second.user.id, draft);

    expect(other.slug).toBe('studio-ana-2');
  });
});
