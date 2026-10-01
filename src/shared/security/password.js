const bcrypt = require('bcryptjs');

const { env } = require('../../config/env');

async function hashPassword(password) {
  return bcrypt.hash(password, env.bcryptRounds);
}

async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

module.exports = {
  hashPassword,
  verifyPassword,
};
