# Implementing Redis for project optimization

### Where to use Redis (high impact first)

- 1. Rate limiting store: switch to a Redis store so limits are shared across instances.
- 2. User cache for JWT middleware: cache `db.user.findById(decoded.id)` to avoid a DB hit per request.
- 3. Query result caching for read-heavy endpoints: cache product `find` queries in the AI route and any public GETs.
- 4. Ephemeral auth data: store WebAuthn challenges and JWT blacklist (if needed) in Redis instead of cookies/db.
- 5. AI / external call memoization: short TTL cache of Gemini NLU results for repeated prompts.
- 6. Optional: background queues (BullMQ) for heavier async tasks; distributed locks if needed.

### Add a Redis client

Create `services/redis.service.ts`:

```ts
import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = createClient({ url: REDIS_URL });

redis.on('error', (err) => console.error('Redis Client Error', err));

export async function redisConnect() {
  if (!redis.isOpen) await redis.connect();
}

export async function redisDisconnect() {
  if (redis.isOpen) await redis.quit();
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const json = await redis.get(key);
  return json ? (JSON.parse(json) as T) : null;
}

export async function cacheSet(key: string, value: unknown, ttlSec: number) {
  await redis.set(key, JSON.stringify(value), { EX: ttlSec });
}

export async function cacheDel(patternOrKey: string) {
  // simple delete; for patterns, scan+del can be added if needed
  await redis.del(patternOrKey);
}
```

Wire it in `main.ts` startup/shutdown (call alongside `dbConnect`/`dbDisconnect`).

### 1) Rate limit with Redis

Replace in-memory limiter in `middlewares/limiter.middlewares.ts`:

```ts
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../services/redis.service';

export const limiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later',
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.sendCommand(args as any),
  }),
});
```

### 2) Cache user lookup in JWT middleware

Update `middlewares/jwtAuth.middlewares.ts`:

```ts
import { cacheGet, cacheSet } from '../services/redis.service';

export const jwtAuth = async (req, _res, next) => {
  const accessToken = req.cookies?.access;
  if (!accessToken) throw new AppError('Unauthorized', { status: 401 });

  const { decoded, expired } = verifyJWT(accessToken);
  if (expired) throw new AppError('Session expired', { status: 401 });

  if (decoded) {
    const key = `user:${decoded.id}`;
    let user = await cacheGet<typeof db.user>(key);
    if (!user) {
      user = await db.user.findById(decoded.id).lean();
      if (!user) throw new AppError('Unauthorized', { status: 401 });
      await cacheSet(key, user, 300); // 5 min
    }
    req.user = user as any;
    return next();
  }
  throw new AppError('Unauthorized', { status: 401 });
};
```

On user updates or password changes, delete `user:${id}` to avoid stale data (add a small helper in user update controllers to `cacheDel`).

### 3) Cache product reads in AI agent

Update `app/aiAgent/ai.controller.ts` around FIND_PRODUCT:

```ts
import { cacheGet, cacheSet } from '../../services/redis.service';

// ...
case 'FIND_PRODUCT': {
  const cacheKey = `products:${userId}:${Buffer.from(JSON.stringify(baseFilters)).toString('base64')}`;
  let products = await cacheGet<any[]>(cacheKey);
  if (!products) {
    products = await db.product.find(baseFilters).limit(20).lean();
    await cacheSet(cacheKey, products, 60); // 1 min TTL
  }
  if (products.length === 0) return "I couldn't find any products matching your criteria.";
  const productNames = products.map((p) => p.name).join(', ');
  return `I found ${products.length} products: ${productNames}.`;
}
```

Invalidate on writes in the same file or in `app/product/product.service.ts` by deleting keys that match `products:${userId}:*`. If you need pattern deletes, add a `scanDel(prefix)` util that SCANs and DELs.

Example invalidation after create/update/delete:

```ts
await db.product.create({ ...entities, userId });
await redis.publish(
  'invalidation',
  JSON.stringify({ prefix: `products:${userId}:` }),
);
```

And run a small subscriber at startup that scans and deletes keys for received prefixes; or just call a helper directly where you have access to `redis`.

### 4) Store WebAuthn challenge in Redis

In `app/auth/auth.controller.ts`, instead of cookie `challenge`, use Redis:

- When initiating:

```ts
const challengeKey = `webauthn:challenge:${user._id}`;
await cacheSet(challengeKey, { challenge, exp: Date.now() + 120000 }, 120);
```

- When verifying:

```ts
const data = await cacheGet<{ challenge: string }>(
  `webauthn:challenge:${userId}`,
);
if (!data) throw new AppError('Unknown credential : challenge missing');
const { challenge } = data;
// then delete the key
await cacheDel(`webauthn:challenge:${userId}`);
```

### 5) Optional: JWT blacklist / token revocation

If you add logout-all or rotation, store revoked tokens/jti:

- On revoke: `SETEX jwt:blacklist:${jti} 3600 1`
- On auth: check `EXISTS jwt:blacklist:${jti}`.

### 6) Memoize Gemini NLU results briefly

In `app/aiAgent/ai.service.ts`:

```ts
import { cacheGet, cacheSet } from '../../services/redis.service';

async function getIntentAndEntities(userQuery: string) {
  const key = `nlu:${Buffer.from(userQuery).toString('base64')}`;
  const cached = await cacheGet<any>(key);
  if (cached) return cached;

  // existing call...
  const validatedData = intentSchema.parse(parsedJson);

  await cacheSet(key, validatedData, 30); // 30s
  return validatedData;
}
```

### 7) Boot lifecycle hooks

In `main.ts`, initialize and close Redis:

```ts
import { redisConnect, redisDisconnect } from './services/redis.service';

await redisConnect();
await dbConnect();
// ...
process.on('SIGINT', async () => {
  await redisDisconnect();
  await dbDisconnect();
  process.exit(0);
});
```

### Environment and deps

- Install: `npm i redis rate-limit-redis`
- Env: add `REDIS_URL=redis://localhost:6379`

### Minimal invalidation strategy

- On product write (create/update/delete), delete keys with prefix `products:${userId}:`. For categories, you can also key by category to target fewer keys.
- On user updates, delete `user:${id}`.

### Where this speeds you up

- Rate limiting no longer bounded to a single instance; constant-time Redis ops.
- JWT auth avoids a DB call every request for 5 minutes per user.
- Product queries and repeated AI prompts hit cache for hot paths.
- WebAuthn challenges are secure/centralized; no cookie state.

- I set up a plan and provided concise code edits to integrate Redis for rate limiting, user auth caching, product read caching, WebAuthn challenge storage, and optional NLU memoization.

```typescript
import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = createClient({ url: REDIS_URL });

redis.on('error', (err) => console.error('Redis Client Error', err));

export async function redisConnect() {
  if (!redis.isOpen) await redis.connect();
}

export async function redisDisconnect() {
  if (redis.isOpen) await redis.quit();
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const json = await redis.get(key);
  return json ? (JSON.parse(json) as T) : null;
}

export async function cacheSet(key: string, value: unknown, ttlSec: number) {
  await redis.set(key, JSON.stringify(value), { EX: ttlSec });
}

export async function cacheDel(patternOrKey: string) {
  // simple delete; for patterns, scan+del can be added if needed
  await redis.del(patternOrKey);
}
```

```typescript
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redis } from '../services/redis.service';

export const limiter = rateLimit({
  windowMs: 60_000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later',
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.sendCommand(args as any),
  }),
});
```

```typescript
import { cacheGet, cacheSet } from '../services/redis.service';

export const jwtAuth = async (req, _res, next) => {
  const accessToken = req.cookies?.access;
  if (!accessToken) throw new AppError('Unauthorized', { status: 401 });

  const { decoded, expired } = verifyJWT(accessToken);
  if (expired) throw new AppError('Session expired', { status: 401 });

  if (decoded) {
    const key = `user:${decoded.id}`;
    let user = await cacheGet<typeof db.user>(key);
    if (!user) {
      user = await db.user.findById(decoded.id).lean();
      if (!user) throw new AppError('Unauthorized', { status: 401 });
      await cacheSet(key, user, 300); // 5 min
    }
    req.user = user as any;
    return next();
  }
  throw new AppError('Unauthorized', { status: 401 });
};
```

```typescript
import { cacheGet, cacheSet } from '../../services/redis.service';

// ...
case 'FIND_PRODUCT': {
  const cacheKey = `products:${userId}:${Buffer.from(JSON.stringify(baseFilters)).toString('base64')}`;
  let products = await cacheGet<any[]>(cacheKey);
  if (!products) {
    products = await db.product.find(baseFilters).limit(20).lean();
    await cacheSet(cacheKey, products, 60); // 1 min TTL
  }
  if (products.length === 0) return "I couldn't find any products matching your criteria.";
  const productNames = products.map((p) => p.name).join(', ');
  return `I found ${products.length} products: ${productNames}.`;
}
```

```typescript
await db.product.create({ ...entities, userId });
await redis.publish(
  'invalidation',
  JSON.stringify({ prefix: `products:${userId}:` }),
);
```

```typescript
const challengeKey = `webauthn:challenge:${user._id}`;
await cacheSet(challengeKey, { challenge, exp: Date.now() + 120000 }, 120);
```

```typescript
const data = await cacheGet<{ challenge: string }>(
  `webauthn:challenge:${userId}`,
);
if (!data) throw new AppError('Unknown credential : challenge missing');
const { challenge } = data;
// then delete the key
await cacheDel(`webauthn:challenge:${userId}`);
```

```typescript
import { cacheGet, cacheSet } from '../../services/redis.service';

async function getIntentAndEntities(userQuery: string) {
  const key = `nlu:${Buffer.from(userQuery).toString('base64')}`;
  const cached = await cacheGet<any>(key);
  if (cached) return cached;

  // existing call...
  const validatedData = intentSchema.parse(parsedJson);

  await cacheSet(key, validatedData, 30); // 30s
  return validatedData;
}
```

```typescript
import { redisConnect, redisDisconnect } from './services/redis.service';

await redisConnect();
await dbConnect();
// ...
process.on('SIGINT', async () => {
  await redisDisconnect();
  await dbDisconnect();
  process.exit(0);
});
```

---

**User**

create an docker compose file for redis

---

**Cursor**

### `docker-compose.yml` (Redis only)

```yaml
version: '3.9'

services:
  redis:
    image: redis:7-alpine
    container_name: redis
    command: ['redis-server', '--appendonly', 'yes'] # AOF persistence
    ports:
      - '6379:6379'
    volumes:
      - ./.docker/redis/data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
      timeout: 3s
      retries: 10
    restart: unless-stopped

networks:
  default:
    name: local-net
```

### How to use

- Start: `docker compose up -d`
- Stop: `docker compose down`
- Your app `REDIS_URL`: `redis://localhost:6379`

- Added a minimal `docker-compose.yml` to run Redis with persistence, port mapping, and healthcheck.

```yaml
version: '3.9'

services:
  redis:
    image: redis:7-alpine
    container_name: redis
    command: ['redis-server', '--appendonly', 'yes'] # AOF persistence
    ports:
      - '6379:6379'
    volumes:
      - ./.docker/redis/data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 5s
      timeout: 3s
      retries: 10
    restart: unless-stopped

networks:
  default:
    name: local-net
```
