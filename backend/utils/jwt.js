const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');

const env = require('../config/env');

function signAccessToken({ userId, role }) {
    return jwt.sign({ role, type: 'access' }, env.jwtSecret, {
        subject: String(userId),
        issuer: env.jwtIssuer,
        audience: env.jwtAudience,
        expiresIn: env.jwtExpiresIn,
        algorithm: env.jwtAlgorithm,
        jwtid: randomUUID()
    });
}

function signRefreshToken({ userId, role }) {
    const token = jwt.sign({ role, type: 'refresh' }, env.jwtSecret, {
        subject: String(userId),
        issuer: env.jwtIssuer,
        audience: env.jwtAudience,
        expiresIn: env.jwtRefreshExpiresIn,
        algorithm: env.jwtAlgorithm,
        jwtid: randomUUID()
    });

    const decoded = jwt.decode(token);
    return {
        token,
        jti: decoded.jti,
        expiresAt: new Date(decoded.exp * 1000)
    };
}

function verifyAuthToken(token, expectedType = 'access') {
    const payload = jwt.verify(token, env.jwtSecret, {
        issuer: env.jwtIssuer,
        audience: env.jwtAudience,
        algorithms: [env.jwtAlgorithm]
    });

    if (payload.type !== expectedType) {
        throw new Error('Invalid token type');
    }

    return payload;
}

module.exports = {
    signAccessToken,
    signRefreshToken,
    verifyAuthToken
};
