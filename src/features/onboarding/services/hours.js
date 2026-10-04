function parseMinutes(label) {
  const [hours, minutes] = String(label).split(':').map(Number);
  return hours * 60 + minutes;
}

function formatMinutes(total) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** Converte JSON legado (lista de HH:mm) ou ranges atuais. */
function normalizeRanges(raw) {
  if (!Array.isArray(raw) || raw.length === 0) return [];

  if (typeof raw[0] === 'string') {
    const sorted = raw
      .filter((slot) => typeof slot === 'string' && /^\d{2}:\d{2}$/.test(slot))
      .sort();
    if (!sorted.length) return [];
    const end = formatMinutes(parseMinutes(sorted[sorted.length - 1]) + 30);
    return [{ start: sorted[0], end }];
  }

  return raw
    .filter(
      (range) =>
        range &&
        typeof range.start === 'string' &&
        typeof range.end === 'string' &&
        range.start < range.end,
    )
    .map((range) => ({ start: range.start, end: range.end }));
}

function normalizeOverrides(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const next = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;
    next[key] = normalizeRanges(value);
  }
  return next;
}

module.exports = {
  normalizeRanges,
  normalizeOverrides,
  parseMinutes,
  formatMinutes,
};
