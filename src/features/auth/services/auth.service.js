const { env } = require('../../../config/env');
const { signAccessToken } = require('../../../shared/security/jwt');
const { generateOtpCode } = require('../../../shared/security/otp');
const {
  hashPassword,
  verifyPassword,
} = require('../../../shared/security/password');
const {
  EmailInUseError,
  InvalidCredentialsError,
  InvalidOtpError,
  UserNotFoundError,
} = require('../errors/auth.errors');

class AuthService {
  constructor(repository) {
    this.repository = repository;
  }

  async signUp({ name, email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await this.repository.findByEmail(normalizedEmail);
    if (existing?.status === 'active') {
      throw new EmailInUseError();
    }

    const passwordHash = await hashPassword(password);
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    let user = existing;
    if (!user) {
      user = await this.repository.createUser({
        name,
        email: normalizedEmail,
        passwordHash,
        status: 'pending',
        trialEndsAt,
      });
    } else {
      existing.name = name.trim();
      existing.passwordHash = passwordHash;
      existing.trialEndsAt = trialEndsAt;
      await existing.save();
      user = existing;
    }

    const code = await this.issueCode(user.id, 'email_verification');
    return {
      email: user.email,
      ...(env.isDev ? { code } : {}),
    };
  }

  async verifyEmail({ email, code }) {
    const user = await this.requireUser(email);
    await this.consumeCode(user.id, 'email_verification', code);
    const active = await this.repository.activateUser(user);
    return this.sessionFor(active);
  }

  async resendCode({ email }) {
    const user = await this.requireUser(email);
    const code = await this.issueCode(user.id, 'email_verification');
    return env.isDev ? { code } : {};
  }

  async signIn({ email, password }) {
    const user = await this.repository.findByEmail(email);
    if (!user || user.status !== 'active') {
      throw new InvalidCredentialsError();
    }

    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      throw new InvalidCredentialsError();
    }

    return this.sessionFor(user);
  }

  async forgotPassword({ email }) {
    const user = await this.repository.findByEmail(email);
    if (!user) {
      return {};
    }

    const code = await this.issueCode(user.id, 'password_reset');
    return env.isDev ? { code } : {};
  }

  async resetPassword({ email, code, password }) {
    const user = await this.requireUser(email);
    await this.consumeCode(user.id, 'password_reset', code);
    const passwordHash = await hashPassword(password);
    await this.repository.updatePassword(user, passwordHash);
  }

  async requireUser(email) {
    const user = await this.repository.findByEmail(email);
    if (!user) {
      throw new UserNotFoundError();
    }
    return user;
  }

  async issueCode(userId, purpose) {
    const code = generateOtpCode();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + env.otpTtlMinutes);
    await this.repository.replaceCode({ userId, purpose, code, expiresAt });
    if (env.isDev) {
      console.info(`[auth] OTP ${purpose} for ${userId}: ${code}`);
    }
    return code;
  }

  async consumeCode(userId, purpose, code) {
    if (code === '000000') {
      throw new InvalidOtpError();
    }

    const row = await this.repository.findValidCode({ userId, purpose, code });
    if (!row) {
      throw new InvalidOtpError();
    }

    await this.repository.consumeCode(row);
  }

  sessionFor(user) {
    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        trialEndsAt: user.trialEndsAt.toISOString(),
      },
      accessToken: signAccessToken({ sub: user.id, email: user.email }),
    };
  }
}

module.exports = { AuthService };
