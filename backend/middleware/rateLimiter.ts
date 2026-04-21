import rateLimit from 'express-rate-limit';
import env from '../config/env';

const authRateLimiter = rateLimit({
  windowMs: env.authRateLimitWindowMs,
  max: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication requests, please try again later'
  }
});

export { authRateLimiter };
