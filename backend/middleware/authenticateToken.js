const { verifyAuthToken } = require('../utils/jwt');

async function authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

    if (!token) {
        return res.status(401).json({ error: 'Invalid token format' });
    }

    try {
        const payload = verifyAuthToken(token, 'access');
        req.userId = payload.sub;
        req.userRole = payload.role;
        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = authenticateToken;
