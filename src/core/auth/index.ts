// Barrel export for the auth module
export { hashPassword, verifyPassword } from './password-utils';
export {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from './jwt-service';
export { register, login, refresh } from './auth-service';
export { authenticate } from './auth-middleware';
