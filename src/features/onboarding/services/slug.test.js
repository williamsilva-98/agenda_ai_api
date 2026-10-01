const { bookingSlug } = require('./slug');

describe('bookingSlug', () => {
  it('normaliza acentos e espaços', () => {
    expect(bookingSlug('Studio Ana Beleza')).toBe('studio-ana-beleza');
    expect(bookingSlug('Salão São José')).toBe('salao-sao-jose');
    expect(bookingSlug('!!!')).toBe('meu-negocio');
  });
});
