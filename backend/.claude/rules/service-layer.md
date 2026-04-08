# Service Layer Rules

You are editing the **service layer** — the orchestrator. Services contain business logic and coordinate between the controller (HTTP adapter) and the repository port (infrastructure boundary).

## Allowed imports ONLY

```typescript
import { Injectable, HttpStatus, UnprocessableEntityException } from '@nestjs/common';
import { XRepository } from './infrastructure/persistence/x.repository'; // abstract port
import { X } from './domain/x';                // domain entity
import { CreateXDto, UpdateXDto } from './dto/'; // DTOs
import { OtherService } from '../other/other.service'; // sibling services
import { NullableType } from '../utils/types/nullable.type';
import { IPaginationOptions } from '../utils/types/pagination-options';
```

## Forbidden — these are bugs

| Forbidden | Why | Correct alternative |
|-----------|-----|---------------------|
| `import { InjectRepository } from '@nestjs/typeorm'` | Services inject the port, not the ORM | Inject `XRepository` abstract class directly |
| `import { InjectModel } from '@nestjs/mongoose'` | Same as above for Mongoose | Inject `XRepository` abstract class directly |
| `import { Repository } from 'typeorm'` | Leaks ORM into business logic | Use abstract `XRepository` port |
| `import { Model } from 'mongoose'` | Leaks ODM into business logic | Use abstract `XRepository` port |
| `import ... from '.../infrastructure/persistence/relational/...'` | Bypass the port abstraction | Import from `infrastructure/persistence/x.repository.ts` only |
| Returning raw DB entity from repository | Must convert to domain entity | The mapper handles conversion; repository returns domain type |
| `throw new Error(...)` or `throw new BadRequestException(...)` | Wrong error shape | Always `UnprocessableEntityException` with `{ status, errors }` |

## Canonical service pattern

```typescript
@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UserRepository,  // ← abstract port, NOT @InjectRepository
    private readonly filesService: FilesService,        // ← other services are fine
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // 1. Validate uniqueness / references via the repository port
    if (createUserDto.email) {
      const existing = await this.usersRepository.findByEmail(createUserDto.email);
      if (existing) {
        throw new UnprocessableEntityException({       // ← always this shape
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: { email: 'emailAlreadyExists' },    // ← i18n key, not a message
        });
      }
    }

    // 2. Hash / transform sensitive data
    let password: string | undefined;
    if (createUserDto.password) {
      const salt = await bcrypt.genSalt();
      password = await bcrypt.hash(createUserDto.password, salt);
    }

    // 3. Delegate persistence to the repository port
    return this.usersRepository.create({ ...createUserDto, password });
  }

  findById(id: User['id']): Promise<NullableType<User>> {
    return this.usersRepository.findById(id);  // ← thin delegation is fine
  }
}
```

## Error handling

Always throw `UnprocessableEntityException` with this exact shape:

```typescript
throw new UnprocessableEntityException({
  status: HttpStatus.UNPROCESSABLE_ENTITY,
  errors: {
    fieldName: 'i18nErrorKey',   // e.g. 'emailAlreadyExists', 'imageNotExists'
  },
});
```

Never throw `BadRequestException`, `NotFoundException`, or generic `Error` from a service. The exception shape is what the frontend parses.

## Quick checklist before saving

- [ ] Constructor injects abstract `XRepository` port, not `@InjectRepository(XEntity)`
- [ ] No `typeorm`, `mongoose`, `@nestjs/typeorm`, `@nestjs/mongoose` imports
- [ ] Errors use `UnprocessableEntityException` with `{ status, errors }` shape
- [ ] All methods return domain types (from `domain/`), never raw DB entities
