function bookingSlug(name) {
  const accents = {
    á: 'a',
    à: 'a',
    â: 'a',
    ã: 'a',
    ä: 'a',
    é: 'e',
    è: 'e',
    ê: 'e',
    ë: 'e',
    í: 'i',
    ì: 'i',
    î: 'i',
    ï: 'i',
    ó: 'o',
    ò: 'o',
    ô: 'o',
    õ: 'o',
    ö: 'o',
    ú: 'u',
    ù: 'u',
    û: 'u',
    ü: 'u',
    ç: 'c',
    ñ: 'n',
  };

  let normalized = '';
  for (const char of String(name).toLowerCase()) {
    normalized += accents[char] ?? char;
  }

  const slug = normalized
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .join('-');

  return slug || 'meu-negocio';
}

module.exports = { bookingSlug };
