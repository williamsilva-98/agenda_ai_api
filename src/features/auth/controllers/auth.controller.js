const {
  forgotPasswordSchema,
  resendCodeSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  verifyEmailSchema,
} = require('../schemas/auth.schemas');

class AuthController {
  constructor(service) {
    this.service = service;
  }

  signUp = async (req, res) => {
    const body = signUpSchema.parse(req.body);
    const result = await this.service.signUp(body);
    res.status(201).json(result);
  };

  verifyEmail = async (req, res) => {
    const body = verifyEmailSchema.parse(req.body);
    const session = await this.service.verifyEmail(body);
    res.status(200).json(session);
  };

  resendCode = async (req, res) => {
    const body = resendCodeSchema.parse(req.body);
    const result = await this.service.resendCode(body);
    res.status(200).json(result);
  };

  signIn = async (req, res) => {
    const body = signInSchema.parse(req.body);
    const session = await this.service.signIn(body);
    res.status(200).json(session);
  };

  forgotPassword = async (req, res) => {
    const body = forgotPasswordSchema.parse(req.body);
    const result = await this.service.forgotPassword(body);
    res.status(200).json(result);
  };

  resetPassword = async (req, res) => {
    const body = resetPasswordSchema.parse(req.body);
    await this.service.resetPassword(body);
    res.status(204).send();
  };
}

module.exports = { AuthController };
