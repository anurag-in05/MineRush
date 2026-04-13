const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const authRateLimiter = rateLimit({
    windowMs: env.authRateLimitWindowMs,
    max: env.authRateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many authentication requests, please try again later'
    }
});

module.exports = {
    authRateLimiter
};
