# Domain Layer Rules

You are editing the **domain layer** — the innermost ring of the Hexagonal Architecture. These rules are non-negotiable correctness constraints, not style preferences.

## What the domain layer is

`src/{module}/domain/{entity}.ts` contains the **pure business representation** of an entity. It has no knowledge of how it is stored, retrieved, or transported. It is used by the service layer and returned from it.

## Allowed imports ONLY

```typescript
import { ApiProperty } from '@nestjs/swagger';          // Swagger documentation only
import { Expose, Exclude, Type } from 'class-transformer'; // Serialization only
// Other domain entities from sibling modules (domain types only, not services/repos)
```

## Forbidden — these are bugs, not style issues

| Forbidden | Why | Correct alternative |
|-----------|-----|---------------------|
| `import { Entity, Column } from 'typeorm'` | DB schema belongs in infrastructure | Use `infrastructure/persistence/relational/entities/` |
| `import { Schema, Prop } from '@nestjs/mongoose'` | DB schema belongs in infrastructure | Use `infrastructure/persistence/document/entities/` |
| `import { InjectRepository } from '@nestjs/typeorm'` | Injection belongs in services | Inject abstract `XRepository` port in the service |
| `import { Injectable } from '@nestjs/common'` | Domain is not a NestJS provider | Domain entities are plain classes |
| `import ... from '../../infrastructure/persistence/...'` | Domain must not depend on infrastructure | Define a port (abstract class) in `infrastructure/persistence/x.repository.ts` |

## Required pattern — domain entity

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

export class User {
  @ApiProperty({ type: Number })
  id: number | string;

  @ApiProperty({ type: String, example: 'john@example.com' })
  @Expose({ groups: ['me', 'admin'] })   // ← class-transformer for serialization
  email: string | null;

  @Exclude({ toPlainOnly: true })        // ← never leak password in responses
  password?: string;

  @ApiProperty({ type: String })
  firstName: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}
```

**Key rules for domain entities:**
- Plain TypeScript `class` — no decorators except `@ApiProperty`, `@Expose`, `@Exclude`, `@Type`
- Never add `@Entity()`, `@Schema()`, or any ORM decorator
- Sensitive fields (passwords, secrets) get `@Exclude({ toPlainOnly: true })`
- Sensitive metadata (email, socialId) get `@Expose({ groups: ['me', 'admin'] })`
- Use `number | string` for ID to support both PostgreSQL and MongoDB

## Quick checklist before saving

- [ ] No TypeORM imports (`typeorm`, `@nestjs/typeorm`)
- [ ] No Mongoose imports (`mongoose`, `@nestjs/mongoose`)
- [ ] No `@Injectable()`, `@InjectRepository()`, `@InjectModel()` decorators
- [ ] No imports from `infrastructure/` directories
- [ ] Sensitive fields use `@Exclude` or `@Expose({ groups: [...] })`
