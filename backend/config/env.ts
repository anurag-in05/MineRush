import path from 'path';
import dotenv from 'dotenv';
import { Algorithm } from 'jsonwebtoken';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Env {
  port: number;
  mongoUri: string | undefined;
  jwtSecret: string;
  jwtExpiresIn: string;
  jwtRefreshExpiresIn: string;
  jwtIssuer: string;
  jwtAudience: string;
  jwtAlgorithm: Algorithm;
  bcryptSaltRounds: number;
  loginMaxAttempts: number;
  loginLockMs: number;
  authRateLimitWindowMs: number;
  authRateLimitMax: number;
  corsOrigin: string;
}

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET is not set');
}

const env: Env = {
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  jwtIssuer: process.env.JWT_ISSUER || 'minerush-api',
  jwtAudience: process.env.JWT_AUDIENCE || 'minerush-client',
  jwtAlgorithm: (process.env.JWT_ALGORITHM || 'HS256') as Algorithm,
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
  loginMaxAttempts: Number(process.env.LOGIN_MAX_ATTEMPTS) || 5,
  loginLockMs: Number(process.env.LOGIN_LOCK_MS) || 15 * 60 * 1000,
  authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  corsOrigin: process.env.CORS_ORIGIN || ''
};

export default env;
