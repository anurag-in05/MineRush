const express = require('express');
const bcrypt = require('bcrypt');

const env = require('../config/env');
const { authRateLimiter } = require('../middleware/rateLimiter');
const validateBody = require('../middleware/validateBody');
const authenticateToken = require('../middleware/authenticateToken');
const RefreshToken = require('../models/RefreshToken');
const User = require('../models/User');
const { signAccessToken, signRefreshToken, verifyAuthToken } = require('../utils/jwt');
const { hashToken } = require('../utils/tokenHash');
const { loginSchema, refreshTokenSchema, registerSchema } = require('../utils/validationSchemas');

const router = express.Router();

async function issueTokenPair(user) {
    const accessToken = signAccessToken({ userId: user._id, role: user.role });
    const refresh = signRefreshToken({ userId: user._id, role: user.role });

    await RefreshToken.create({
        userId: user._id,
        jti: refresh.jti,
        tokenHash: hashToken(refresh.token),
        expiresAt: refresh.expiresAt
    });

    return {
        accessToken,
        refreshToken: refresh.token
    };
}

router.post('/register', authRateLimiter, validateBody(registerSchema), async (req, res) => {
    const { username, password } = req.body;
    const normalizedUsername = username.trim().toLowerCase();

    try {
        const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
        const newUser = new User({ username: normalizedUsername, password: passwordHash });
        await newUser.save();

        const tokens = await issueTokenPair(newUser);

        return res.status(201).json({
            message: 'User registered',
            token: tokens.accessToken,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                username: newUser.username,
                balance: newUser.balance,
                userId: newUser._id,
                role: newUser.role
            }
        });
    } catch (err) {
        console.error('Registration error:', err);

        if (err.code === 11000) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        if (err.message) {
            return res.status(400).json({ error: err.message });
        }

        return res.status(500).json({ error: 'Registration failed' });
    }
});

router.post('/login', authRateLimiter, validateBody(loginSchema), async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (user.lockUntil && user.lockUntil > new Date()) {
            return res.status(423).json({ error: 'Account temporarily locked due to failed login attempts' });
        }

        const isHash = typeof user.password === 'string' && user.password.startsWith('$2');
        let isValidPassword = false;

        if (isHash) {
            isValidPassword = await bcrypt.compare(password, user.password);
        } else {
            // Transitional fallback for existing plaintext passwords.
            isValidPassword = user.password === password;

            if (isValidPassword) {
                user.password = await bcrypt.hash(password, env.bcryptSaltRounds);
                await user.save();
            }
        }

        if (!isValidPassword) {
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

            if (user.failedLoginAttempts >= env.loginMaxAttempts) {
                user.lockUntil = new Date(Date.now() + env.loginLockMs);
                user.failedLoginAttempts = 0;
            }

            await user.save();
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        await user.save();

        const tokens = await issueTokenPair(user);

        return res.json({
            token: tokens.accessToken,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: {
                username: user.username,
                balance: user.balance,
                userId: user._id,
                role: user.role
            }
        });
    } catch (err) {
        return res.status(500).json({ error: 'Login failed' });
    }
});

router.post('/refresh', authRateLimiter, validateBody(refreshTokenSchema), async (req, res) => {
    const { refreshToken } = req.body;

    try {
        const payload = verifyAuthToken(refreshToken, 'refresh');
        const refreshTokenHash = hashToken(refreshToken);

        const tokenDoc = await RefreshToken.findOne({
            userId: payload.sub,
            jti: payload.jti,
            tokenHash: refreshTokenHash,
            revokedAt: null
        });

        if (!tokenDoc || tokenDoc.expiresAt <= new Date()) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        const user = await User.findById(payload.sub);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        const tokens = await issueTokenPair(user);
        const newRefreshPayload = verifyAuthToken(tokens.refreshToken, 'refresh');

        tokenDoc.revokedAt = new Date();
        tokenDoc.replacedByJti = newRefreshPayload.jti;
        await tokenDoc.save();

        return res.json({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken
        });
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
});

router.post('/logout', authenticateToken, validateBody(refreshTokenSchema), async (req, res) => {
    const { refreshToken } = req.body;

    try {
        const payload = verifyAuthToken(refreshToken, 'refresh');

        if (payload.sub !== String(req.userId)) {
            return res.status(403).json({ error: 'Forbidden' });
        }

        const tokenDoc = await RefreshToken.findOne({
            userId: payload.sub,
            jti: payload.jti,
            tokenHash: hashToken(refreshToken),
            revokedAt: null
        });

        if (tokenDoc) {
            tokenDoc.revokedAt = new Date();
            await tokenDoc.save();
        }

        return res.json({ message: 'Logged out successfully' });
    } catch (err) {
        return res.status(401).json({ error: 'Invalid refresh token' });
    }
});

module.exports = router;
