# Testing Rules

Tests are behavior specifications. Each test describes one scenario — what happens under a specific condition. Not how the code works internally.

---

## Test commands

```bash
npm run test           # unit tests (jest, no Docker needed)
npm run test:e2e       # E2E tests (requires Docker + running DB)
npm run test -- --watch                  # watch mode
npm run test -- --coverage              # coverage report
npm run test -- --testPathPattern=users # run single module tests
```

---

## Test structure: describe / it

Use `describe` blocks for grouping context, and `it` for individual behaviors.

```typescript
// src/users/users.service.spec.ts

describe('UsersService', () => {
  describe('create()', () => {
    it('should create a user and return the domain entity', async () => { ... });
    it('should hash the password before persisting', async () => { ... });
    it('should throw UnprocessableEntityException when email already exists', async () => { ... });
  });

  describe('findById()', () => {
    it('should return the user when found', async () => { ... });
    it('should return null when user does not exist', async () => { ... });
  });
});
```

**Naming rules:**
- `describe` block: class name + method name
- `it` block: natural language starting with "should"
- One assertion focus per `it` — never combine two "when" scenarios in one test

---

## Unit tests: mock the repository port

Unit tests cover service logic. They mock the abstract repository port with `jest.fn()` stubs — they never spin up a real DB.

```typescript
// src/users/users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { FilesService } from '../files/files.service';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: jest.Mocked<UserRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UserRepository,
          useValue: {
            create: jest.fn(),
            findById: jest.fn(),
            findByEmail: jest.fn(),
            findByIds: jest.fn(),
            findManyWithPagination: jest.fn(),
            findBySocialIdAndProvider: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
          },
        },
        {
          provide: FilesService,
          useValue: { findById: jest.fn() },
        },
      ],
    }).compile();

    service = module.get(UsersService);
    userRepository = module.get(UserRepository);
  });

  describe('create()', () => {
    it('should throw when email already exists', async () => {
      userRepository.findByEmail.mockResolvedValue({ id: 1, email: 'a@b.com' } as any);

      await expect(
        service.create({ email: 'a@b.com', password: 'pass' } as any),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should persist the user and return a domain entity', async () => {
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue({ id: 1, email: 'a@b.com' } as any);

      const result = await service.create({ email: 'a@b.com' } as any);

      expect(userRepository.create).toHaveBeenCalledOnce();
      expect(result.email).toBe('a@b.com');
    });
  });
});
```

---

## What to cover for every service method

1. **Happy path** — normal flow returns correct domain entity
2. **Validation failure** — `UnprocessableEntityException` thrown with correct `errors` key
3. **Not found** — method returns `null` when entity doesn't exist (not an exception)
4. **Side effects** — verify mocked methods were called with correct arguments

---

## E2E tests: full HTTP stack

E2E tests exercise the full request lifecycle via HTTP. They require Docker (see `docker-compose.yaml`).

```typescript
// test/user/user.e2e-spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    await app.init();
    // login to get token...
  });

  afterAll(() => app.close());

  it('POST /api/v1/users — admin creates a user', async () => {
    return request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'test@example.com', firstName: 'Test' })
      .expect(201)
      .expect((res) => {
        expect(res.body.id).toBeDefined();
        expect(res.body.email).toBeUndefined(); // non-admin group, not exposed
      });
  });
});
```

---

## Forbidden test patterns

| Forbidden | Why | Correct alternative |
|-----------|-----|---------------------|
| `jest.spyOn(repo, 'findByEmail').mockReturnValue(...)` directly on a real class | Spies on implementation details | Mock the whole provider via `useValue` |
| Testing private methods | Private = implementation detail | Test via the public method that calls it |
| `test(...)` instead of `it(...)` | Inconsistent with codebase style | Always `it('should ...')` |
| Testing repository adapters with real DB in unit tests | Slow, requires DB | Use integration tests for adapters |
| One `it` block asserting multiple unrelated behaviors | Obscures failures | One assertion theme per `it` |

---

## Quick checklist before saving

- [ ] Test file lives next to source (`users.service.spec.ts`) or in `test/` for E2E
- [ ] Unit tests use `@nestjs/testing` `createTestingModule` with `useValue` mocks
- [ ] Repository is mocked via the abstract port class token, not the concrete adapter
- [ ] Every error path has an `it` block verifying the exception shape
- [ ] E2E tests clean up state in `afterAll` / `afterEach`
