import jwt, { JwtPayload } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import type { StringValue } from 'ms';
import env from '../config/env';

export interface AuthTokenPayload extends JwtPayload {
  role: string;
  type: 'access' | 'refresh';
  sub: string;
  jti: string;
  exp: number;
}

interface SignTokenInput {
  userId: string | object;
  role: string;
}

interface RefreshTokenResult {
  token: string;
  jti: string;
  expiresAt: Date;
}

function signAccessToken({ userId, role }: SignTokenInput): string {
  return jwt.sign({ role, type: 'access' }, env.jwtSecret, {
    subject: String(userId),
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
    expiresIn: env.jwtExpiresIn as StringValue,
    algorithm: env.jwtAlgorithm,
    jwtid: randomUUID()
  });
}

function signRefreshToken({ userId, role }: SignTokenInput): RefreshTokenResult {
  const token = jwt.sign({ role, type: 'refresh' }, env.jwtSecret, {
    subject: String(userId),
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
    expiresIn: env.jwtRefreshExpiresIn as StringValue,
    algorithm: env.jwtAlgorithm,
    jwtid: randomUUID()
  });

  const decoded = jwt.decode(token) as AuthTokenPayload;
  return {
    token,
    jti: decoded.jti,
    expiresAt: new Date(decoded.exp * 1000)
  };
}

function verifyAuthToken(token: string, expectedType: 'access' | 'refresh' = 'access'): AuthTokenPayload {
  const payload = jwt.verify(token, env.jwtSecret, {
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
    algorithms: [env.jwtAlgorithm]
  }) as AuthTokenPayload;

  if (payload.type !== expectedType) {
    throw new Error('Invalid token type');
  }

  return payload;
}

export { signAccessToken, signRefreshToken, verifyAuthToken };
