const { AppError } = require('../errors/app-error');
const { verifyAccessToken } = require('../security/jwt');

function requireAuth(req, _res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError('Não autorizado.', 401, 'UNAUTHORIZED');
    }

    const token = header.slice('Bearer '.length).trim();
    if (!token) {
      throw new AppError('Não autorizado.', 401, 'UNAUTHORIZED');
    }

    const payload = verifyAccessToken(token);
    if (!payload?.sub) {
      throw new AppError('Não autorizado.', 401, 'UNAUTHORIZED');
    }

    req.userId = payload.sub;
    req.auth = payload;
    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    next(new AppError('Não autorizado.', 401, 'UNAUTHORIZED'));
  }
}

module.exports = { requireAuth };
