# Conventions — Agent Development Guide

**Audience:** AI coding agents and developers adding features to this codebase.

This document is the single source of truth for how to make changes. Follow it exactly. Do not invent new patterns — extend existing ones.

---

## 0. Read before touching code

1. The reference implementation is `src/users/`. When uncertain about any pattern, read the equivalent file there.
2. The dependency direction is always inward: Infrastructure → Service → Controller ← (HTTP). Domain is the innermost ring with no DB dependencies.
3. The public surface of a module is its `*.service.ts`. Never import from a module's `infrastructure/` directly from another module.
4. All domain code is plain TypeScript. No TypeORM/Mongoose decorators in `domain/`.

---

## 1. Adding a feature to an existing module

### 1a. Adding a new endpoint (write operation)

- [ ] **Step 1 — DTO:** create or update `dto/create-x.dto.ts` or `dto/update-x.dto.ts` with class-validator + class-transformer decorators and `@ApiProperty` on every field.
- [ ] **Step 2 — Service method:** add `async handleX(dto: XDto): Promise<X>` to `x.service.ts`. Validate input, throw `UnprocessableEntityException({ status, errors })` on failure, call the repository port.
- [ ] **Step 3 — Repository port:** add the abstract method signature to `infrastructure/persistence/x.repository.ts`.
- [ ] **Step 4 — Repository adapters:** implement the method in both `relational/repositories/` and `document/repositories/` (or whichever DB types are active). Return domain entity via mapper.
- [ ] **Step 5 — Controller route:** add endpoint to `x.controller.ts` with `@ApiCreatedResponse` / `@ApiOkResponse`, `@SerializeOptions`, `@HttpCode`, and route decorator.
- [ ] **Step 6 — Tests:** write unit test for the service method in `x.service.spec.ts`. Cover happy path + error path.

### 1b. Adding a query (read operation)

- [ ] **Step 1 — Query DTO:** add or update `dto/query-x.dto.ts` with filter/sort/pagination options.
- [ ] **Step 2 — Service method:** add `findX(...)` method. Query handlers never mutate state. Return domain type or `null`.
- [ ] **Step 3 — Repository port:** add abstract `findX` method.
- [ ] **Step 4 — Repository adapters:** implement in relational and/or document adapters.
- [ ] **Step 5 — Controller route:** `@Get` route with `@ApiOkResponse` and `@SerializeOptions`.
- [ ] **Step 6 — Tests:** unit test for not-found (returns `null`) and found cases.

---

## 2. Adding a new module

Use the CLI scaffolding first — it generates the full Hexagonal Architecture skeleton:

```bash
npm run generate:resource:relational -- --name Category   # PostgreSQL
npm run generate:resource:document   -- --name Category   # MongoDB
npm run generate:resource:all-db     -- --name Category   # both
```

Then follow this checklist to complete the implementation:

### Step 1 — Domain entity

In `src/{name}/domain/{name}.ts`:
- Plain TypeScript `class` — no `@Entity`, `@Schema`, or ORM decorators
- All fields use `@ApiProperty` / `@ApiPropertyOptional`
- Sensitive fields use `@Exclude({ toPlainOnly: true })`
- Access-controlled fields use `@Expose({ groups: ['me', 'admin'] })`
- Use `number | string` for the ID field to support both DB types

### Step 2 — Repository port

In `src/{name}/infrastructure/persistence/{name}.repository.ts`:
- `export abstract class {Name}Repository`
- Declare all methods as `abstract` with typed domain return values
- Use focused, single-purpose method names (see `docs/architecture.md` — Recommendations)
- Never use `interface` — NestJS DI requires a class token

### Step 3 — Repository adapters

In `src/{name}/infrastructure/persistence/relational/repositories/{name}s.repository.ts`:
- `@Injectable() export class {Name}sRelationalRepository implements {Name}Repository`
- Use `@InjectRepository({Name}Entity)` in constructor
- Implement every abstract method from the port
- Always return domain entities via `{Name}Mapper.toDomain(entity)`, never raw ORM entities

In `src/{name}/infrastructure/persistence/document/repositories/{name}s.repository.ts`:
- Same pattern with `@InjectModel({Name}SchemaClass.name)`

### Step 4 — Mappers

In `src/{name}/infrastructure/persistence/relational/mappers/{name}.mapper.ts`:
```typescript
export class {Name}Mapper {
  static toDomain(raw: {Name}Entity): {Name} { ... }
  static toPersistence(domain: {Name}): {Name}Entity { ... }
}
```

### Step 5 — DTOs

In `src/{name}/dto/`:
- `create-{name}.dto.ts` — `CreateXDto`
- `update-{name}.dto.ts` — `UpdateXDto` (extends `PartialType(CreateXDto)`)
- `query-{name}.dto.ts` — `Query{Name}Dto` with filter/sort/pagination

### Step 6 — Service

In `src/{name}/{name}s.service.ts`:
```typescript
@Injectable()
export class {Name}sService {
  constructor(private readonly {name}sRepository: {Name}Repository) {}

  async create(dto: Create{Name}Dto): Promise<{Name}> {
    // validate → throw UnprocessableEntityException on failure
    return this.{name}sRepository.create(dto);
  }

  findById(id: {Name}['id']): Promise<NullableType<{Name}>> {
    return this.{name}sRepository.findById(id);
  }
}
```

### Step 7 — Controller

In `src/{name}/{name}s.controller.ts`:
- `@ApiTags('{name}s')`, `@ApiBearerAuth()`
- `@UseGuards(AuthGuard('jwt'), RolesGuard)` with appropriate `@Roles`
- `@Controller({ path: '{name}s', version: '1' })`
- Pagination via `infinityPagination()` and `InfinityPaginationResponse({Name})`

### Step 8 — Module

In `src/{name}/{name}s.module.ts`:
- Import the appropriate persistence module dynamically based on `DatabaseConfig`
- Export the service so other modules can use it

### Step 9 — App module

Register the new module in `src/app.module.ts` imports array.

### Step 10 — Database

For relational:
```bash
npm run migration:generate -- src/database/migrations/Create{Name}Table
npm run migration:run:relational
```

For document: Mongoose creates collections automatically from the schema.

### Step 11 — Tests

Create `src/{name}/{name}s.service.spec.ts`:
- Unit tests for every service method
- Mock `{Name}Repository` via `useValue` with `jest.fn()` stubs
- Cover: happy path, `UnprocessableEntityException`, `null` returns

Create `test/{name}/` for E2E:
- Full HTTP test via Supertest
- Cover: authenticated requests, role-based access, validation errors

---

## 3. Naming conventions

| Item | Convention | Example |
|------|-----------|---------|
| Module directory | `kebab-case` | `users/`, `auth-google/`, `session/` |
| Domain entity class | `PascalCase` noun | `User`, `Session`, `FileType` |
| Domain entity file | `kebab-case.ts` | `user.ts`, `session.ts` |
| Repository port | `PascalCase` + `Repository` | `UserRepository` |
| Repository adapter | `PascalCase` + `Relational/DocumentRepository` | `UsersRelationalRepository` |
| TypeORM entity | `PascalCase` + `Entity` | `UserEntity` |
| Mongoose schema | `PascalCase` + `SchemaClass` | `UserSchemaClass` |
| Mapper | `PascalCase` + `Mapper` | `UserMapper` |
| Service | `PascalCase` + `Service` | `UsersService` |
| Controller | `PascalCase` + `Controller` | `UsersController` |
| Module | `PascalCase` + `Module` | `UsersModule` |
| Create DTO | `Create` + `PascalCase` + `Dto` | `CreateUserDto` |
| Update DTO | `Update` + `PascalCase` + `Dto` | `UpdateUserDto` |
| Query DTO | `Query` + `PascalCase` + `Dto` | `QueryUserDto` |

---

## 4. Forbidden patterns

These are correctness violations, not style preferences.

| Forbidden | Why | Correct alternative |
|-----------|-----|---------------------|
| `@Entity()` in `domain/` | ORM couples domain to DB | Use `infrastructure/persistence/relational/entities/` |
| `@Schema()` in `domain/` | ODM couples domain to DB | Use `infrastructure/persistence/document/entities/` |
| `@InjectRepository` in service | Bypasses port abstraction | Inject `XRepository` abstract class |
| `Repository<XEntity>` in service | ORM type leak | Inject `XRepository` abstract class |
| `return entity` from repository | Leaks DB schema | Return `XMapper.toDomain(entity)` |
| `throw new Error(...)` in service | Wrong error shape | `throw new UnprocessableEntityException({ status, errors })` |
| Direct import of another module's `infrastructure/` | Cross-module coupling | Import the other module's service |
| `findOne({ where: condition })` directly in service | Bypasses port | Add focused method to `XRepository` port |
| `settings = new ConfigService()` at top of file | Untestable singleton | Use NestJS DI: `constructor(private config: ConfigService)` |
| Committing `.env` files | Security risk | Use `.env.example` templates only |

---

## 5. File layout checklist for agents

When creating a new file, verify:

- [ ] Located in the correct layer (domain / service / controller / infrastructure / dto)
- [ ] Imports follow the dependency direction (no inward violations)
- [ ] Domain file: no TypeORM/Mongoose imports, no `@Injectable`
- [ ] Service file: abstract port injected, `UnprocessableEntityException` used for errors
- [ ] Repository adapter: all abstract methods implemented, domain type returned via mapper
- [ ] DTO file: `@ApiProperty` on every field, class-validator decorators present
- [ ] Module file: persistence module imported dynamically, service exported
- [ ] Corresponding test file created or updated

---

Previous: [Architecture](architecture.md)

Next: [CLI](cli.md)
