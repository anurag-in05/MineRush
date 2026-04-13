const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const env = {
    port: Number(process.env.PORT) || 3000,
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    jwtIssuer: process.env.JWT_ISSUER || 'minerush-api',
    jwtAudience: process.env.JWT_AUDIENCE || 'minerush-client',
    jwtAlgorithm: process.env.JWT_ALGORITHM || 'HS256',
    bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
    loginMaxAttempts: Number(process.env.LOGIN_MAX_ATTEMPTS) || 5,
    loginLockMs: Number(process.env.LOGIN_LOCK_MS) || 15 * 60 * 1000,
    authRateLimitWindowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    authRateLimitMax: Number(process.env.AUTH_RATE_LIMIT_MAX) || 20,
    corsOrigin: process.env.CORS_ORIGIN || ''
};

if (!env.jwtSecret) {
    throw new Error('JWT_SECRET is not set');
}

module.exports = env;
