const { Op } = require('sequelize');

const { AuthCode, User } = require('../models/auth.models');

class AuthRepository {
  findByEmail(email) {
    return User.findOne({ where: { email: email.toLowerCase() } });
  }

  findById(id) {
    return User.findByPk(id);
  }

  createUser({ name, email, passwordHash, status, trialEndsAt }) {
    return User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      status,
      trialEndsAt,
    });
  }

  async replaceCode({ userId, purpose, code, expiresAt }) {
    await AuthCode.destroy({
      where: {
        userId,
        purpose,
        consumedAt: { [Op.is]: null },
      },
    });

    return AuthCode.create({
      userId,
      purpose,
      code,
      expiresAt,
      consumedAt: null,
    });
  }

  findValidCode({ userId, purpose, code }) {
    return AuthCode.findOne({
      where: {
        userId,
        purpose,
        code,
        consumedAt: { [Op.is]: null },
        expiresAt: { [Op.gt]: new Date() },
      },
    });
  }

  async consumeCode(code) {
    code.consumedAt = new Date();
    await code.save();
  }

  async activateUser(user) {
    user.status = 'active';
    await user.save();
    return user;
  }

  async updatePassword(user, passwordHash) {
    user.passwordHash = passwordHash;
    await user.save();
  }
}

module.exports = { AuthRepository };
