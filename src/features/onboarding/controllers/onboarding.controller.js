const { onboardingBodySchema } = require('../schemas/onboarding.schemas');

class OnboardingController {
  constructor(service) {
    this.service = service;
  }

  get = async (req, res) => {
    const result = await this.service.get(req.userId);
    res.status(200).json(result);
  };

  save = async (req, res) => {
    const body = onboardingBodySchema.parse(req.body);
    const result = await this.service.save(req.userId, body);
    res.status(200).json(result);
  };

  complete = async (req, res) => {
    const body = onboardingBodySchema.parse(req.body);
    const result = await this.service.complete(req.userId, body);
    res.status(200).json(result);
  };
}

module.exports = { OnboardingController };
