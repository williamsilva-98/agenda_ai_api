const { normalizeRanges, formatMinutes, parseMinutes } = require('./hours');

describe('normalizeRanges', () => {
  it('mantém faixas atuais', () => {
    expect(
      normalizeRanges([
        { start: '09:00', end: '12:00' },
        { start: '14:00', end: '18:00' },
      ]),
    ).toEqual([
      { start: '09:00', end: '12:00' },
      { start: '14:00', end: '18:00' },
    ]);
  });

  it('converte slots legados em uma faixa', () => {
    expect(normalizeRanges(['10:00', '09:00', '11:00'])).toEqual([
      { start: '09:00', end: '11:30' },
    ]);
  });

  it('formata minutos', () => {
    expect(formatMinutes(90)).toBe('01:30');
    expect(parseMinutes('01:30')).toBe(90);
  });
});
