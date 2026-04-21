# TypeScript Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the MineRush Express backend from JavaScript to TypeScript, file by file, with `strict: true` from day one.

**Architecture:** `allowJs: true` lets existing `.js` files coexist during migration. Each `.ts` file uses ES `import`/`export` syntax compiled to CommonJS. A shared `types/express.d.ts` augments the Express `Request` type with `userId` and `userRole`.

**Tech Stack:** TypeScript 5, Express 5, Mongoose 8, Zod 4, jsonwebtoken 9, bcrypt, tsx (dev runner), tsc (build)

---

### Task 0: Install TypeScript tooling

**Files:**
- Modify: `backend/package.json`
- Create: `backend/tsconfig.json`

- [ ] **Step 1: Install dev dependencies**

Run from `backend/`:
```bash
npm install --save-dev typescript tsx @types/node @types/express @types/jsonwebtoken @types/bcrypt @types/cors
```

- [ ] **Step 2: Create `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "allowJs": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["**/*.ts", "**/*.js"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

- [ ] **Step 3: Update `backend/package.json` scripts**

Replace the `scripts` block with:
```json
"scripts": {
  "dev": "tsx server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "test": "node --test tests/**/*.test.js"
}
```

- [ ] **Step 4: Verify the compiler runs**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: compiler runs (there will be errors in existing `.js` files — that's fine, they'll be fixed as we migrate each one).

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json package-lock.json
git commit -m "chore: add TypeScript tooling and tsconfig"
```

---

### Task 1: Migrate config/env.ts

**Files:**
- Delete: `backend/config/env.js`
- Create: `backend/config/env.ts`

- [ ] **Step 1: Delete the old file**

```bash
rm backend/config/env.js
```

- [ ] **Step 2: Create `backend/config/env.ts`**

```typescript
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
```

**TypeScript concepts introduced:**
- `interface Env` — defines the shape of an object
- `: Env` — type annotation on a variable
- `string | undefined` — union type (can be either)
- `as Algorithm` — type assertion ("trust me, this is a valid Algorithm string")

- [ ] **Step 3: Verify**

```bash
cd backend && npx tsc --noEmit 2>&1 | grep "config/env"
```

Expected: no output (no errors for this file).

- [ ] **Step 4: Commit**

```bash
git add config/env.ts
git commit -m "feat(ts): migrate config/env to TypeScript"
```

---

### Task 2: Migrate config/database.ts

**Files:**
- Delete: `backend/config/database.js`
- Create: `backend/config/database.ts`

- [ ] **Step 1: Delete the old file**

```bash
rm backend/config/database.js
```

- [ ] **Step 2: Create `backend/config/database.ts`**

```typescript
import mongoose from 'mongoose';

async function connectDatabase(mongoUri: string | undefined): Promise<void> {
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set');
  }
  await mongoose.connect(mongoUri);
}

export { connectDatabase };
```

**TypeScript concepts introduced:**
- `: Promise<void>` — return type of an async function that returns nothing
- Note: `useNewUrlParser` and `useUnifiedTopology` are removed — deprecated in Mongoose 8

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "config/database"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add config/database.ts
git commit -m "feat(ts): migrate config/database to TypeScript"
```

---

### Task 3: Migrate utils/dateUtils.ts

**Files:**
- Delete: `backend/utils/dateUtils.js`
- Create: `backend/utils/dateUtils.ts`

- [ ] **Step 1: Delete the old file**

```bash
rm backend/utils/dateUtils.js
```

- [ ] **Step 2: Create `backend/utils/dateUtils.ts`**

```typescript
function isSameCalendarDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;

  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isPreviousCalendarDay(lastDate: Date | null, currentDate: Date | null): boolean {
  if (!lastDate || !currentDate) return false;

  const last = new Date(lastDate);
  const current = new Date(currentDate);
  last.setHours(0, 0, 0, 0);
  current.setHours(0, 0, 0, 0);

  const oneDay = 1000 * 60 * 60 * 24;
  return (current.getTime() - last.getTime()) / oneDay === 1;
}

export { isPreviousCalendarDay, isSameCalendarDay };
```

**TypeScript concepts introduced:**
- `Date | null` — parameters can be a Date or null
- `.getTime()` — required because strict mode won't let you subtract two `Date` objects directly

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "utils/dateUtils"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add utils/dateUtils.ts
git commit -m "feat(ts): migrate utils/dateUtils to TypeScript"
```

---

### Task 4: Migrate utils/gameUtils.ts

**Files:**
- Delete: `backend/utils/gameUtils.js`
- Create: `backend/utils/gameUtils.ts`

- [ ] **Step 1: Delete the old file**

```bash
rm backend/utils/gameUtils.js
```

- [ ] **Step 2: Create `backend/utils/gameUtils.ts`**

```typescript
function generateMines(mineCount: number): number[] {
  const positions = [...Array(25).keys()];

  for (let i = positions.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [positions[i], positions[j]] = [positions[j], positions[i]];
  }

  return positions.slice(0, mineCount);
}

function calculateMultiplier(revealedCount: number, mineCount: number): number {
  let probability = 1;

  for (let i = 0; i < revealedCount; i += 1) {
    probability *= (25 - mineCount - i) / (25 - i);
  }

  return 0.98 / probability;
}

export { calculateMultiplier, generateMines };
```

**TypeScript concepts introduced:**
- `: number` — primitive type annotation
- `: number[]` — array of numbers

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "utils/gameUtils"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add utils/gameUtils.ts
git commit -m "feat(ts): migrate utils/gameUtils to TypeScript"
```

---

### Task 5: Migrate utils/tokenHash.ts

**Files:**
- Delete: `backend/utils/tokenHash.js`
- Create: `backend/utils/tokenHash.ts`

- [ ] **Step 1: Delete the old file**

```bash
rm backend/utils/tokenHash.js
```

- [ ] **Step 2: Create `backend/utils/tokenHash.ts`**

```typescript
import { createHash } from 'crypto';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export { hashToken };
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "utils/tokenHash"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add utils/tokenHash.ts
git commit -m "feat(ts): migrate utils/tokenHash to TypeScript"
```

---

### Task 6: Migrate utils/jwt.ts

**Files:**
- Delete: `backend/utils/jwt.js`
- Create: `backend/utils/jwt.ts`

- [ ] **Step 1: Delete the old file**

```bash
rm backend/utils/jwt.js
```

- [ ] **Step 2: Create `backend/utils/jwt.ts`**

```typescript
import jwt, { JwtPayload } from 'jsonwebtoken';
import { randomUUID } from 'crypto';
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
    expiresIn: env.jwtExpiresIn,
    algorithm: env.jwtAlgorithm,
    jwtid: randomUUID()
  });
}

function signRefreshToken({ userId, role }: SignTokenInput): RefreshTokenResult {
  const token = jwt.sign({ role, type: 'refresh' }, env.jwtSecret, {
    subject: String(userId),
    issuer: env.jwtIssuer,
    audience: env.jwtAudience,
    expiresIn: env.jwtRefreshExpiresIn,
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
```

**TypeScript concepts introduced:**
- `interface ... extends JwtPayload` — interface inheritance (adds fields to an existing type)
- `'access' | 'refresh'` — string literal union (only these exact values allowed)
- `string | object` — Mongoose ObjectId is an object, so userId can be either
- Exporting the interface so middleware and routes can import and use it

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "utils/jwt"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add utils/jwt.ts
git commit -m "feat(ts): migrate utils/jwt to TypeScript"
```

---

### Task 7: Migrate utils/validationSchemas.ts

**Files:**
- Delete: `backend/utils/validationSchemas.js`
- Create: `backend/utils/validationSchemas.ts`

- [ ] **Step 1: Delete the old file**

```bash
rm backend/utils/validationSchemas.js
```

- [ ] **Step 2: Create `backend/utils/validationSchemas.ts`**

```typescript
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
```

**TypeScript concepts introduced:**
- Zod schemas are self-typing — `z.infer<typeof registerSchema>` gives you the TypeScript type of any validated object from that schema. Routes will use this in later tasks.

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "utils/validationSchemas"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add utils/validationSchemas.ts
git commit -m "feat(ts): migrate utils/validationSchemas to TypeScript"
```

---

### Task 8: Create types/express.d.ts

This file extends Express's built-in `Request` type so TypeScript knows that `req.userId` and `req.userRole` exist (they are set by `authenticateToken`).

**Files:**
- Create: `backend/types/express.d.ts`

- [ ] **Step 1: Create `backend/types/express.d.ts`**

```typescript
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: string;
    }
  }
}

export {};
```

**TypeScript concepts introduced:**
- `declare global` — adds to the global type scope without needing an import
- `namespace Express` — merges with Express's existing namespace (called declaration merging)
- `export {}` — required to make this file a module so `declare global` works

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "types/express"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add types/express.d.ts
git commit -m "feat(ts): add Express Request augmentation for userId and userRole"
```

---

### Task 9: Migrate models/User.ts

**Files:**
- Delete: `backend/models/User.js`
- Create: `backend/models/User.ts`

- [ ] **Step 1: Delete the old file**

```bash
rm backend/models/User.js
```

- [ ] **Step 2: Create `backend/models/User.ts`**

```typescript
import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  password: string;
  role: 'user' | 'admin';
  balance: number;
  totalWins: number;
  gamesPlayed: number;
  failedLoginAttempts: number;
  lockUntil: Date | null;
  createdAt: Date;
  dailyQuest: {
    gamesPlayed: number;
    lastQuestDate: Date | null;
    claimed: boolean;
  };
  dayStreak: number;
  lastPlayedDate: Date | null;
  streakMultiplier: number;
}

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{10,128}$/;

const userSchema = new Schema<IUser>({
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    lowercase: true,
    minlength: 3,
    maxlength: 32,
    match: /^[a-zA-Z0-9_]+$/
  },
  password: {
    type: String,
    required: true,
    validate: {
      validator(value: string) {
        return /^\$2[aby]\$\d{2}\$.{53}$/.test(value) || strongPasswordRegex.test(value);
      },
      message: 'Password does not satisfy policy requirements'
    }
  },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  balance: { type: Number, default: 10000, min: 0 },
  totalWins: { type: Number, default: 0, min: 0 },
  gamesPlayed: { type: Number, default: 0, min: 0 },
  failedLoginAttempts: { type: Number, default: 0, min: 0 },
  lockUntil: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  dailyQuest: {
    gamesPlayed: { type: Number, default: 0, min: 0 },
    lastQuestDate: { type: Date, default: null },
    claimed: { type: Boolean, default: false }
  },
  dayStreak: { type: Number, default: 0, min: 0 },
  lastPlayedDate: { type: Date, default: null },
  streakMultiplier: { type: Number, default: 1.0, min: 1.0 }
});

export default model<IUser>('User', userSchema);
```

**TypeScript concepts introduced:**
- `extends Document` — inherits all Mongoose document methods (`.save()`, `._id`, etc.)
- `Schema<IUser>` — Mongoose generic: TypeScript enforces the schema matches the interface
- `model<IUser>` — the model's query methods return typed `IUser` instances
- `export interface IUser` — exported so routes can import and use it

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "models/User"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add models/User.ts
git commit -m "feat(ts): migrate models/User to TypeScript"
```

---

### Task 10: Migrate models/RefreshToken.ts

**Files:**
- Delete: `backend/models/RefreshToken.js`
- Create: `backend/models/RefreshToken.ts`

- [ ] **Step 1: Delete the old file**

```bash
rm backend/models/RefreshToken.js
```

- [ ] **Step 2: Create `backend/models/RefreshToken.ts`**

```typescript
import { Schema, model, Document, Types } from 'mongoose';

export interface IRefreshToken extends Document {
  userId: Types.ObjectId;
  jti: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByJti: string | null;
  createdAt: Date;
}

const refreshTokenSchema = new Schema<IRefreshToken>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  jti: { type: String, required: true, unique: true, index: true },
  tokenHash: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true },
  revokedAt: { type: Date, default: null },
  replacedByJti: { type: String, default: null },
  createdAt: { type: Date, default: Date.now }
});

export default model<IRefreshToken>('RefreshToken', refreshTokenSchema);
```

**TypeScript concepts introduced:**
- `Types.ObjectId` — Mongoose's type for document ID references

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "models/RefreshToken"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add models/RefreshToken.ts
git commit -m "feat(ts): migrate models/RefreshToken to TypeScript"
```

---

### Task 11: Migrate models/Game.ts

**Files:**
- Delete: `backend/models/Game.js`
- Create: `backend/models/Game.ts`

- [ ] **Step 1: Delete the old file**

```bash
rm backend/models/Game.js
```

- [ ] **Step 2: Create `backend/models/Game.ts`**

```typescript
import { Schema, model, Document, Types } from 'mongoose';

export interface IGame extends Document {
  userId: Types.ObjectId;
  betAmount: number;
  mineCount: number;
  grid: Array<'hidden' | 'mine' | 'safe'>;
  revealedCount: number;
  gameOver: boolean;
  winAmount: number;
  mines: number[];
  createdAt: Date;
}

const gameSchema = new Schema<IGame>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  betAmount: { type: Number, required: true, min: 0.01 },
  mineCount: { type: Number, required: true, min: 1, max: 24 },
  grid: {
    type: [{ type: String, enum: ['hidden', 'mine', 'safe'] }],
    validate: {
      validator(value: string[]) {
        return Array.isArray(value) && value.length === 25;
      },
      message: 'Grid must contain exactly 25 cells'
    }
  },
  revealedCount: { type: Number, default: 0, min: 0, max: 25 },
  gameOver: { type: Boolean, default: false },
  winAmount: { type: Number, default: 0, min: 0 },
  mines: {
    type: [{ type: Number, min: 0, max: 24 }],
    validate: {
      validator(value: number[]) {
        return Array.isArray(value) && value.length <= 24;
      },
      message: 'Mines must contain at most 24 positions'
    }
  },
  createdAt: { type: Date, default: Date.now }
});

export default model<IGame>('Game', gameSchema);
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "models/Game"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add models/Game.ts
git commit -m "feat(ts): migrate models/Game to TypeScript"
```

---

### Task 12: Migrate middleware/rateLimiter.ts

**Files:**
- Delete: `backend/middleware/rateLimiter.js`
- Create: `backend/middleware/rateLimiter.ts`

- [ ] **Step 1: Delete the old file**

```bash
rm backend/middleware/rateLimiter.js
```

- [ ] **Step 2: Create `backend/middleware/rateLimiter.ts`**

```typescript
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
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "middleware/rateLimiter"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add middleware/rateLimiter.ts
git commit -m "feat(ts): migrate middleware/rateLimiter to TypeScript"
```

---

### Task 13: Migrate middleware/validateBody.ts

**Files:**
- Delete: `backend/middleware/validateBody.js`
- Create: `backend/middleware/validateBody.ts`

- [ ] **Step 1: Delete the old file**

```bash
rm backend/middleware/validateBody.js
```

- [ ] **Step 2: Create `backend/middleware/validateBody.ts`**

```typescript
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { ZodSchema } from 'zod';

function validateBody(schema: ZodSchema): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const firstMessage = result.error.issues[0]?.message || 'Invalid request body';
      res.status(400).json({
        error: firstMessage,
        details: result.error.issues.map((issue) => ({
          path: issue.path.join('.') || 'body',
          message: issue.message
        }))
      });
      return;
    }

    req.body = result.data;
    next();
  };
}

export default validateBody;
```

**TypeScript concepts introduced:**
- `ZodSchema` — the type of any Zod schema object
- `RequestHandler` — Express's type for middleware functions
- `Request`, `Response`, `NextFunction` — Express's parameter types
- Note: Express 5 with strict TS requires `res.json(...); return;` instead of `return res.json(...)`

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "middleware/validateBody"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add middleware/validateBody.ts
git commit -m "feat(ts): migrate middleware/validateBody to TypeScript"
```

---

### Task 14: Migrate middleware/authenticateToken.ts

**Files:**
- Delete: `backend/middleware/authenticateToken.js`
- Create: `backend/middleware/authenticateToken.ts`

- [ ] **Step 1: Delete the old file**

```bash
rm backend/middleware/authenticateToken.js
```

- [ ] **Step 2: Create `backend/middleware/authenticateToken.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { verifyAuthToken } from '../utils/jwt';

async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;

  if (!token) {
    res.status(401).json({ error: 'Invalid token format' });
    return;
  }

  try {
    const payload = verifyAuthToken(token, 'access');
    req.userId = payload.sub;
    req.userRole = payload.role;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export default authenticateToken;
```

**TypeScript concepts introduced:**
- `req.userId` and `req.userRole` are now type-safe thanks to `types/express.d.ts` from Task 8
- Without that declaration file, TypeScript would error: "Property 'userId' does not exist on type Request"

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "middleware/authenticateToken"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add middleware/authenticateToken.ts
git commit -m "feat(ts): migrate middleware/authenticateToken to TypeScript"
```

---

### Task 15: Migrate middleware/authorizeRole.ts

**Files:**
- Delete: `backend/middleware/authorizeRole.js`
- Create: `backend/middleware/authorizeRole.ts`

- [ ] **Step 1: Delete the old file**

```bash
rm backend/middleware/authorizeRole.js
```

- [ ] **Step 2: Create `backend/middleware/authorizeRole.ts`**

```typescript
import { Request, Response, NextFunction, RequestHandler } from 'express';

function authorizeRole(...allowedRoles: string[]): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole) {
      res.status(403).json({ error: 'Role not found in token' });
      return;
    }
    if (!allowedRoles.includes(req.userRole)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }
    next();
  };
}

export default authorizeRole;
```

**TypeScript concepts introduced:**
- `...allowedRoles: string[]` — rest parameters with a type (collects all arguments into a typed array)

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "middleware/authorizeRole"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add middleware/authorizeRole.ts
git commit -m "feat(ts): migrate middleware/authorizeRole to TypeScript"
```

---

### Task 16: Migrate routes/authRoutes.ts

**Files:**
- Delete: `backend/routes/authRoutes.js`
- Create: `backend/routes/authRoutes.ts`

- [ ] **Step 1: Delete the old file**

```bash
rm backend/routes/authRoutes.js
```

- [ ] **Step 2: Create `backend/routes/authRoutes.ts`**

```typescript
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
```

**TypeScript concepts introduced:**
- `err: unknown` — strict mode requires you to check the type of caught errors before using them
- `as z.infer<typeof registerSchema>` — extracts the TypeScript type from a Zod schema
- `IUser` imported to type the `issueTokenPair` helper parameter

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "routes/authRoutes"
```

Expected: no output.

- [ ] **Step 4: Run integration tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add routes/authRoutes.ts
git commit -m "feat(ts): migrate routes/authRoutes to TypeScript"
```

---

### Task 17: Migrate routes/gameRoutes.ts

**Files:**
- Delete: `backend/routes/gameRoutes.js`
- Create: `backend/routes/gameRoutes.ts`

- [ ] **Step 1: Delete the old file**

```bash
rm backend/routes/gameRoutes.js
```

- [ ] **Step 2: Create `backend/routes/gameRoutes.ts`**

```typescript
import express, { Request, Response } from 'express';
import { z } from 'zod';
import authenticateToken from '../middleware/authenticateToken';
import validateBody from '../middleware/validateBody';
import Game from '../models/Game';
import User from '../models/User';
import { isPreviousCalendarDay, isSameCalendarDay } from '../utils/dateUtils';
import { calculateMultiplier, generateMines } from '../utils/gameUtils';
import { cashoutSchema, revealTileSchema, startGameSchema } from '../utils/validationSchemas';

const router = express.Router();

router.post('/game/start', authenticateToken, validateBody(startGameSchema), async (req: Request, res: Response) => {
  const { betAmount, mineCount } = req.body as z.infer<typeof startGameSchema>;

  try {
    const user = await User.findById(req.userId);

    if (!user || user.balance < betAmount) {
      res.status(400).json({ error: 'Insufficient balance' });
      return;
    }

    user.balance -= betAmount;

    const today = new Date();
    const lastPlayed = user.lastPlayedDate ? new Date(user.lastPlayedDate) : null;

    if (isSameCalendarDay(lastPlayed, today)) {
      // Keep current streak when user already played today.
    } else if (isPreviousCalendarDay(lastPlayed, today)) {
      user.dayStreak = (user.dayStreak || 0) + 1;
    } else {
      user.dayStreak = 1;
    }

    user.lastPlayedDate = today;
    user.streakMultiplier = 1 + 0.1 * user.dayStreak;
    await user.save();

    const mines = generateMines(mineCount);
    const newGame = new Game({
      userId: user._id,
      betAmount,
      mineCount,
      grid: Array(25).fill('hidden'),
      revealedCount: 0,
      gameOver: false,
      winAmount: 0,
      mines
    });
    await newGame.save();

    const multiplier = calculateMultiplier(newGame.revealedCount, newGame.mineCount);

    res.json({
      gameId: newGame._id,
      balance: user.balance,
      multiplier,
      game: {
        grid: newGame.grid,
        revealedCount: newGame.revealedCount,
        gameOver: newGame.gameOver,
        winAmount: newGame.winAmount,
        mines: newGame.mines,
        betAmount: newGame.betAmount,
        mineCount: newGame.mineCount
      },
      dailyQuest: user.dailyQuest
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to start game' });
  }
});

router.post('/game/reveal', authenticateToken, validateBody(revealTileSchema), async (req: Request, res: Response) => {
  const { gameId, position } = req.body as z.infer<typeof revealTileSchema>;

  try {
    const game = await Game.findById(gameId);

    if (!game || !game.userId.equals(req.userId) || game.gameOver) {
      res.status(400).json({ error: 'Invalid game' });
      return;
    }

    if (game.grid[position] !== 'hidden') {
      res.status(400).json({ error: 'Invalid move' });
      return;
    }

    if (game.mines.includes(position)) {
      game.grid[position] = 'mine';
      game.gameOver = true;
      await game.save();

      const user = await User.findById(req.userId);
      if (user) {
        user.gamesPlayed = (user.gamesPlayed || 0) + 1;

        const today = new Date();
        const questDate = user.dailyQuest.lastQuestDate ? new Date(user.dailyQuest.lastQuestDate) : null;

        if (!isSameCalendarDay(questDate, today)) {
          user.dailyQuest.gamesPlayed = 1;
          user.dailyQuest.lastQuestDate = today;
          user.dailyQuest.claimed = false;
        } else {
          user.dailyQuest.gamesPlayed += 1;
        }

        await user.save();
      }

      res.json({
        result: 'mine',
        position,
        grid: game.grid,
        gameOver: true,
        mines: game.mines
      });
      return;
    }

    game.grid[position] = 'safe';
    game.revealedCount += 1;
    const multiplier = calculateMultiplier(game.revealedCount, game.mineCount);
    await game.save();

    res.json({
      result: 'safe',
      position,
      multiplier: multiplier.toFixed(2),
      revealedCount: game.revealedCount,
      grid: game.grid,
      gameOver: false
    });
  } catch (err) {
    res.status(500).json({ error: 'Reveal failed' });
  }
});

router.post('/game/cashout', authenticateToken, validateBody(cashoutSchema), async (req: Request, res: Response) => {
  const { gameId } = req.body as z.infer<typeof cashoutSchema>;

  try {
    const game = await Game.findById(gameId);
    const user = await User.findById(req.userId);

    if (!game || !user || !game.userId.equals(req.userId) || game.gameOver) {
      res.status(400).json({ error: 'Invalid game' });
      return;
    }

    if (game.revealedCount === 0) {
      res.status(400).json({ error: 'Cannot cash out' });
      return;
    }

    const multiplier = calculateMultiplier(game.revealedCount, game.mineCount);
    const winAmount = game.betAmount * multiplier;

    game.winAmount = winAmount;
    game.gameOver = true;
    await game.save();

    user.gamesPlayed = (user.gamesPlayed || 0) + 1;

    const today = new Date();
    const questDate = user.dailyQuest.lastQuestDate ? new Date(user.dailyQuest.lastQuestDate) : null;

    if (!isSameCalendarDay(questDate, today)) {
      user.dailyQuest.gamesPlayed = 1;
      user.dailyQuest.lastQuestDate = today;
      user.dailyQuest.claimed = false;
    } else {
      user.dailyQuest.gamesPlayed += 1;
    }

    user.balance += winAmount;
    user.totalWins = (user.totalWins || 0) + 1;
    await user.save();

    res.json({
      winAmount,
      multiplier,
      balance: user.balance,
      game: {
        grid: game.grid,
        revealedCount: game.revealedCount,
        gameOver: game.gameOver,
        winAmount: game.winAmount,
        mines: game.mines,
        betAmount: game.betAmount,
        mineCount: game.mineCount
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Cashout failed' });
  }
});

router.get('/game/state', authenticateToken, async (req: Request, res: Response) => {
  try {
    const game = await Game.findOne({ userId: req.userId, gameOver: false }).sort({ createdAt: -1 });

    if (!game) {
      res.json({ game: null });
      return;
    }

    res.json({
      gameId: game._id,
      grid: game.grid,
      revealedCount: game.revealedCount,
      gameOver: game.gameOver,
      winAmount: game.winAmount,
      mines: game.mines,
      betAmount: game.betAmount,
      mineCount: game.mineCount
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch game state' });
  }
});

export default router;
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "routes/gameRoutes"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add routes/gameRoutes.ts
git commit -m "feat(ts): migrate routes/gameRoutes to TypeScript"
```

---

### Task 18: Migrate routes/userRoutes.ts

**Files:**
- Delete: `backend/routes/userRoutes.js`
- Create: `backend/routes/userRoutes.ts`

- [ ] **Step 1: Delete the old file**

```bash
rm backend/routes/userRoutes.js
```

- [ ] **Step 2: Create `backend/routes/userRoutes.ts`**

```typescript
import express, { Request, Response } from 'express';
import authenticateToken from '../middleware/authenticateToken';
import authorizeRole from '../middleware/authorizeRole';
import User from '../models/User';
import { isSameCalendarDay } from '../utils/dateUtils';

const router = express.Router();

router.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      username: user.username,
      balance: user.balance,
      userId: user._id,
      role: user.role,
      totalWins: user.totalWins || 0,
      gamesPlayed: user.gamesPlayed || 0,
      dailyQuest: {
        gamesPlayed: user.dailyQuest?.gamesPlayed || 0,
        lastQuestDate: user.dailyQuest?.lastQuestDate || null,
        claimed: user.dailyQuest?.claimed || false
      },
      dayStreak: user.dayStreak || 0,
      streakMultiplier: user.streakMultiplier || 1.0
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user info' });
  }
});

router.get('/admin/users', authenticateToken, authorizeRole('admin'), async (req: Request, res: Response) => {
  try {
    const users = await User.find({}, 'username role balance totalWins gamesPlayed createdAt').sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/quest/claim', authenticateToken, async (req: Request, res: Response) => {
  const QUEST_GAMES_REQUIRED = 5;
  const QUEST_REWARD = 500;

  try {
    const user = await User.findById(req.userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const today = new Date();
    const questDate = user.dailyQuest.lastQuestDate ? new Date(user.dailyQuest.lastQuestDate) : null;

    if (!isSameCalendarDay(questDate, today)) {
      res.status(400).json({ error: 'No quest progress for today' });
      return;
    }

    if (user.dailyQuest.claimed) {
      res.status(400).json({ error: 'Quest already claimed' });
      return;
    }

    if (user.dailyQuest.gamesPlayed < QUEST_GAMES_REQUIRED) {
      res.status(400).json({ error: 'Quest not completed yet' });
      return;
    }

    user.balance += QUEST_REWARD;
    user.dailyQuest.claimed = true;
    await user.save();

    res.json({
      message: 'Quest reward claimed',
      balance: user.balance,
      dailyQuest: user.dailyQuest
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to claim quest reward' });
  }
});

export default router;
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit 2>&1 | grep "routes/userRoutes"
```

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add routes/userRoutes.ts
git commit -m "feat(ts): migrate routes/userRoutes to TypeScript"
```

---

### Task 19: Migrate server.ts

**Files:**
- Delete: `backend/server.js`
- Create: `backend/server.ts`

- [ ] **Step 1: Delete the old file**

```bash
rm backend/server.js
```

- [ ] **Step 2: Create `backend/server.ts`**

```typescript
import express, { Application } from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database';
import env from './config/env';
import authRoutes from './routes/authRoutes';
import gameRoutes from './routes/gameRoutes';
import userRoutes from './routes/userRoutes';

function createApp(): Application {
  const app = express();

  if (env.corsOrigin) {
    app.use(cors({ origin: env.corsOrigin }));
  } else {
    app.use(cors());
  }

  app.use(express.json());
  app.use(authRoutes);
  app.use(gameRoutes);
  app.use(userRoutes);
  return app;
}

async function startServer(): Promise<void> {
  try {
    await connectDatabase(env.mongoUri);
    const app = createApp();
    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}

if (require.main === module) {
  startServer();
}

export { createApp, startServer };
```

- [ ] **Step 3: Run full type check — should be zero errors**

```bash
npx tsc --noEmit
```

Expected: no output (zero errors).

- [ ] **Step 4: Start the server to verify it runs**

```bash
npm run dev
```

Expected: `Server running on port 3000`. Stop with Ctrl+C.

- [ ] **Step 5: Run integration tests**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add server.ts
git commit -m "feat(ts): migrate server to TypeScript — migration complete"
```
