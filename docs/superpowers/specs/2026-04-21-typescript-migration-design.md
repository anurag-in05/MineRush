# TypeScript Migration Design — MineRush Backend

**Date:** 2026-04-21  
**Goal:** Migrate the Node.js/Express backend from JavaScript to TypeScript incrementally, with `strict: true` from day one, to improve code quality and catch bugs at compile time.

---

## Approach

Incremental file-by-file migration with `allowJs: true` so existing `.js` files coexist during the transition. Every migrated `.ts` file is held to `strict: true` — no `any` as an escape hatch, errors are fixed properly.

---

## Tooling

### New dev dependencies
- `typescript` — the TypeScript compiler (`tsc`)
- `tsx` — fast TypeScript runner for development (replaces `ts-node`)
- `@types/node`
- `@types/express`
- `@types/jsonwebtoken`
- `@types/bcrypt`
- `@types/cors`

### `tsconfig.json` (at `backend/`)
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
  "include": ["./**/*.ts", "./**/*.js"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

### Updated `package.json` scripts
```json
{
  "dev": "tsx server.ts",
  "build": "tsc",
  "start": "node dist/server.js",
  "test": "node --test tests/**/*.test.js"
}
```

---

## Migration Order

Migrate bottom-up — files with no local imports first, entry point last.

| Step | File | Key TypeScript concept introduced |
|------|------|----------------------------------|
| 1 | `config/env.ts` | Basic types, typed object export |
| 2 | `config/database.ts` | Function return types |
| 3 | `utils/dateUtils.ts` | Typed function parameters |
| 4 | `utils/gameUtils.ts` | Return type annotations |
| 5 | `utils/tokenHash.ts` | Simple utility types |
| 6 | `utils/jwt.ts` | Interfaces for JWT payload |
| 7 | `utils/validationSchemas.ts` | Zod inferred types (`z.infer<>`) |
| 8 | `models/User.ts` | Mongoose document interface, generic schema |
| 9 | `models/RefreshToken.ts` | Mongoose document typing |
| 10 | `models/Game.ts` | Mongoose document typing |
| 11 | `middleware/rateLimiter.ts` | Express middleware types |
| 12 | `middleware/validateBody.ts` | Generic middleware, Zod schema typing |
| 13 | `middleware/authenticateToken.ts` | Express `Request` interface augmentation |
| 14 | `middleware/authorizeRole.ts` | Rest parameters typing |
| 15 | `routes/authRoutes.ts` | Typed route handlers |
| 16 | `routes/gameRoutes.ts` | Async handlers, typed request bodies |
| 17 | `routes/userRoutes.ts` | Typed route handlers |
| 18 | `server.ts` | Final wiring, module exports |

---

## Key Design Decisions

### Express Request augmentation
`req.userId` and `req.userRole` are added to the request object in `authenticateToken`. TypeScript doesn't know about these by default. We extend the Express `Request` type via a declaration file:

```ts
// types/express.d.ts
declare namespace Express {
  interface Request {
    userId?: string;
    userRole?: string;
  }
}
```

This file is created at step 13 and used by all middleware and routes.

### Mongoose document types
Each model file will define an interface for the document shape and pass it as a generic to `mongoose.Schema` and `mongoose.model`:

```ts
interface IUser {
  username: string;
  password: string;
  role: 'user' | 'admin';
  balance: number;
  // ...
}
const User = mongoose.model<IUser>('User', userSchema);
```

### Import/export syntax
All migrated `.ts` files use ES module-style `import`/`export` syntax. TypeScript compiles this to CommonJS (`require`/`module.exports`) via `"module": "CommonJS"` in tsconfig, so the runtime behavior is unchanged.

### No test migration
`tests/auth.integration.test.js` stays as `.js` for now. It's excluded from the tsconfig `rootDir` scope and continues running with `node --test`.

---

## Success Criteria
- `tsc --noEmit` passes with zero errors after all files are migrated
- `npm run dev` starts the server correctly
- All existing integration tests still pass
- No use of `any` in migrated files
