const { randomInt } = require('crypto');

function generateOtpCode() {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

module.exports = { generateOtpCode };
