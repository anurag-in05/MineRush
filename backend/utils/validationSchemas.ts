import { z } from 'zod';

const objectId = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid id format');

const usernameSchema = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(32, 'Username must be at most 32 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

const strongPasswordSchema = z
  .string()
  .min(10, 'Password must be at least 10 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[0-9]/, 'Password must include a number')
  .regex(/[^a-zA-Z0-9]/, 'Password must include a special character');

const registerSchema = z.object({
  username: usernameSchema,
  password: strongPasswordSchema
});

const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1).max(128)
});

const startGameSchema = z.object({
  betAmount: z.number().positive(),
  mineCount: z.number().int().min(1).max(24)
});

const revealTileSchema = z.object({
  gameId: objectId,
  position: z.number().int().min(0).max(24)
});

const cashoutSchema = z.object({
  gameId: objectId
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(20)
});

export {
  cashoutSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  revealTileSchema,
  startGameSchema
};
