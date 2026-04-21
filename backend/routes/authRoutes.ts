import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import env from '../config/env';
import { authRateLimiter } from '../middleware/rateLimiter';
import validateBody from '../middleware/validateBody';
import authenticateToken from '../middleware/authenticateToken';
import RefreshToken from '../models/RefreshToken';
import User, { IUser } from '../models/User';
import { signAccessToken, signRefreshToken, verifyAuthToken } from '../utils/jwt';
import { hashToken } from '../utils/tokenHash';
import { loginSchema, refreshTokenSchema, registerSchema } from '../utils/validationSchemas';

const router = express.Router();

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

async function issueTokenPair(user: IUser): Promise<TokenPair> {
  const accessToken = signAccessToken({ userId: user._id, role: user.role });
  const refresh = signRefreshToken({ userId: user._id, role: user.role });

  await RefreshToken.create({
    userId: user._id,
    jti: refresh.jti,
    tokenHash: hashToken(refresh.token),
    expiresAt: refresh.expiresAt
  });

  return { accessToken, refreshToken: refresh.token };
}

router.post('/register', authRateLimiter, validateBody(registerSchema), async (req: Request, res: Response) => {
  const { username, password } = req.body as z.infer<typeof registerSchema>;
  const normalizedUsername = username.trim().toLowerCase();

  try {
    const passwordHash = await bcrypt.hash(password, env.bcryptSaltRounds);
    const newUser = new User({ username: normalizedUsername, password: passwordHash });
    await newUser.save();

    const tokens = await issueTokenPair(newUser);

    res.status(201).json({
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
  } catch (err: unknown) {
    console.error('Registration error:', err);

    if (typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === 11000) {
      res.status(400).json({ error: 'Username already exists' });
      return;
    }

    if (
      typeof err === 'object' &&
      err !== null &&
      'name' in err &&
      (err as { name: string }).name === 'ValidationError' &&
      'errors' in err
    ) {
      const validationErr = err as { errors: Record<string, { message: string }> };
      const firstMessage = Object.values(validationErr.errors)[0]?.message || 'Validation failed';
      res.status(400).json({ error: firstMessage });
      return;
    }

    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', authRateLimiter, validateBody(loginSchema), async (req: Request, res: Response) => {
  const { username, password } = req.body as z.infer<typeof loginSchema>;
  const normalizedUsername = username.trim().toLowerCase();

  try {
    const user = await User.findOne({ username: normalizedUsername });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      res.status(423).json({ error: 'Account temporarily locked due to failed login attempts' });
      return;
    }

    const isHash = typeof user.password === 'string' && user.password.startsWith('$2');
    let isValidPassword = false;

    if (isHash) {
      isValidPassword = await bcrypt.compare(password, user.password);
    } else {
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
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    const tokens = await issueTokenPair(user);

    res.json({
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
    res.status(500).json({ error: 'Login failed' });
  }
});

router.post('/refresh', authRateLimiter, validateBody(refreshTokenSchema), async (req: Request, res: Response) => {
  const { refreshToken } = req.body as z.infer<typeof refreshTokenSchema>;

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
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const tokens = await issueTokenPair(user);
    const newRefreshPayload = verifyAuthToken(tokens.refreshToken, 'refresh');

    tokenDoc.revokedAt = new Date();
    tokenDoc.replacedByJti = newRefreshPayload.jti;
    await tokenDoc.save();

    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

router.post('/logout', authenticateToken, validateBody(refreshTokenSchema), async (req: Request, res: Response) => {
  const { refreshToken } = req.body as z.infer<typeof refreshTokenSchema>;

  try {
    const payload = verifyAuthToken(refreshToken, 'refresh');

    if (payload.sub !== String(req.userId)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
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

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

export default router;
