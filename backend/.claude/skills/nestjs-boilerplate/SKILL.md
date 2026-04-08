# NestJS Boilerplate — Project Skill

Use this skill when adding features, writing tests, reviewing code, or creating new modules in this codebase.

---

## 1. Dependency rules

The arrow points inward — outer layers depend on inner, never the reverse.

```
HTTP Request
     ↓
Controller  (src/{module}/{module}.controller.ts)
     ↓
Service     (src/{module}/{module}.service.ts)
     ↓
Repository Port  (src/{module}/infrastructure/persistence/{module}.repository.ts)
     ↑
Repository Adapter  (src/{module}/infrastructure/persistence/relational/ or document/)
     ↓
Database (PostgreSQL via TypeORM  |  MongoDB via Mongoose)
```

| Layer | Allowed imports | Forbidden |
|-------|----------------|-----------|
| `domain/` | `@nestjs/swagger`, `class-transformer`, other domain types | TypeORM, Mongoose, `@Injectable`, `@InjectRepository` |
| `*.service.ts` | domain types, DTOs, abstract repo port, other services, `@nestjs/common` | `typeorm`, `mongoose`, `@InjectRepository`, `@InjectModel` |
| `*.controller.ts` | domain types, DTOs, service, NestJS HTTP decorators, Swagger | repositories directly, TypeORM, Mongoose |
| `infrastructure/persistence/` | TypeORM or Mongoose, domain types (via mapper), abstract port | Business logic, other module's infrastructure |

---

## 2. Domain entity pattern

Plain TypeScript class. No ORM decorators. Serialization via `class-transformer`.

```typescript
// src/users/domain/user.ts
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

export class User {
  @ApiProperty({ type: Number })
  id: number | string;                    // number (Postgres) | string (MongoDB)

  @ApiProperty({ type: String, example: 'john@example.com' })
  @Expose({ groups: ['me', 'admin'] })   // only exposed to own user or admin
  email: string | null;

  @Exclude({ toPlainOnly: true })         // never serialized in responses
  password?: string;

  @ApiProperty({ type: String })
  firstName: string | null;

  @ApiProperty({ type: String })
  lastName: string | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  deletedAt: Date;
}
```

---

## 3. Repository port pattern

Abstract class (not interface — NestJS DI requires a class token).

```typescript
// src/users/infrastructure/persistence/user.repository.ts
import { DeepPartial } from '../../../utils/types/deep-partial.type';
import { NullableType } from '../../../utils/types/nullable.type';
import { IPaginationOptions } from '../../../utils/types/pagination-options';
import { User } from '../../domain/user';
import { FilterUserDto, SortUserDto } from '../../dto/query-user.dto';

export abstract class UserRepository {
  abstract create(
    data: Omit<User, 'id' | 'createdAt' | 'deletedAt' | 'updatedAt'>,
  ): Promise<User>;

  abstract findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterUserDto | null;
    sortOptions?: SortUserDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<User[]>;

  abstract findById(id: User['id']): Promise<NullableType<User>>;
  abstract findByIds(ids: User['id'][]): Promise<User[]>;
  abstract findByEmail(email: User['email']): Promise<NullableType<User>>;

  abstract update(id: User['id'], payload: DeepPartial<User>): Promise<User | null>;
  abstract remove(id: User['id']): Promise<void>;
}
```

**Rule:** One focused method per query shape. Never a universal `find(condition)`.

---

## 4. Repository adapter — relational (TypeORM)

```typescript
// src/users/infrastructure/persistence/relational/repositories/users.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRepository } from '../../user.repository';
import { UserEntity } from '../entities/user.entity';
import { UserMapper } from '../mappers/user.mapper';
import { User } from '../../../../domain/user';
import { NullableType } from '../../../../../utils/types/nullable.type';

@Injectable()
export class UsersRelationalRepository implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly ormRepository: Repository<UserEntity>,
  ) {}

  async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<User> {
    const entity = this.ormRepository.create(UserMapper.toPersistence(data as User));
    const saved = await this.ormRepository.save(entity);
    return UserMapper.toDomain(saved);
  }

  async findByEmail(email: User['email']): Promise<NullableType<User>> {
    if (!email) return null;
    const entity = await this.ormRepository.findOne({ where: { email } });
    return entity ? UserMapper.toDomain(entity) : null;
  }
}
```

---

## 5. Mapper pattern

Static class — no injection, no state. Converts between DB entity and domain entity.

```typescript
// src/users/infrastructure/persistence/relational/mappers/user.mapper.ts
import { User } from '../../../../domain/user';
import { UserEntity } from '../entities/user.entity';

export class UserMapper {
  static toDomain(raw: UserEntity): User {
    const domain = new User();
    domain.id = raw.id;
    domain.email = raw.email;
    domain.firstName = raw.firstName;
    domain.lastName = raw.lastName;
    domain.createdAt = raw.createdAt;
    domain.updatedAt = raw.updatedAt;
    domain.deletedAt = raw.deletedAt;
    return domain;
  }

  static toPersistence(domain: User): UserEntity {
    const entity = new UserEntity();
    if (domain.id) entity.id = domain.id as number;
    entity.email = domain.email;
    entity.firstName = domain.firstName;
    entity.lastName = domain.lastName;
    return entity;
  }
}
```

---

## 6. Service pattern

Inject the abstract port. Validate with `UnprocessableEntityException`.

```typescript
// src/users/users.service.ts
@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UserRepository,  // abstract port — NOT @InjectRepository
    private readonly filesService: FilesService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    if (dto.email) {
      const existing = await this.usersRepository.findByEmail(dto.email);
      if (existing) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: { email: 'emailAlreadyExists' },  // i18n key
        });
      }
    }

    const password = dto.password
      ? await bcrypt.hash(dto.password, await bcrypt.genSalt())
      : undefined;

    return this.usersRepository.create({ ...dto, password });
  }
}
```

**Error shape — always:**
```typescript
throw new UnprocessableEntityException({
  status: HttpStatus.UNPROCESSABLE_ENTITY,
  errors: { fieldName: 'i18nErrorKey' },
});
```

---

## 7. Controller pattern

```typescript
@ApiBearerAuth()
@Roles(RoleEnum.admin)
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiTags('Users')
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiCreatedResponse({ type: User })
  @SerializeOptions({ groups: ['admin'] })  // controls @Expose groups
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUserDto): Promise<User> {
    return this.usersService.create(dto);
  }

  @ApiOkResponse({ type: InfinityPaginationResponse(User) })
  @SerializeOptions({ groups: ['admin'] })
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: QueryUserDto): Promise<InfinityPaginationResponseDto<User>> {
    const page = query?.page ?? 1;
    const limit = Math.min(query?.limit ?? 10, 50);
    return infinityPagination(
      await this.usersService.findManyWithPagination({ ...query, paginationOptions: { page, limit } }),
      { page, limit },
    );
  }
}
```

**Pagination:** Always cap `limit` at 50. Use `infinityPagination()` helper from `utils/`.

---

## 8. DTO pattern

```typescript
// src/users/dto/create-user.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @ApiProperty({ type: String, example: 'test@example.com' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ type: String, minLength: 6 })
  @IsOptional()
  @MinLength(6)
  password?: string;
}
```

**Rules:**
- Use `class-validator` decorators for validation
- Use `class-transformer` `@Transform` for normalization (lowercase email, trim)
- `@ApiProperty` on every field (required), `@ApiPropertyOptional` on optional fields
- Never import domain entities into DTOs — use primitive types or nested DTOs

---

## 9. Naming conventions

| Item | Convention | Example |
|------|-----------|---------|
| Module directory | `kebab-case` | `users/`, `auth-google/` |
| Domain entity | `PascalCase` noun | `User`, `FileType`, `Role` |
| Domain file | `kebab-case.ts` | `user.ts`, `file.ts` |
| Repository port | `PascalCase` + `Repository` | `UserRepository` |
| Repository adapter (relational) | `PascalCase` + `RelationalRepository` | `UsersRelationalRepository` |
| Repository adapter (document) | `PascalCase` + `DocumentRepository` | `UsersDocumentRepository` |
| Mapper | `PascalCase` + `Mapper` | `UserMapper` |
| DB entity (TypeORM) | `PascalCase` + `Entity` | `UserEntity` |
| DB schema (Mongoose) | `PascalCase` + `SchemaClass` | `UserSchemaClass` |
| Service | `PascalCase` + `Service` | `UsersService` |
| Controller | `PascalCase` + `Controller` | `UsersController` |
| Module | `PascalCase` + `Module` | `UsersModule` |
| Create DTO | `Create` + `PascalCase` + `Dto` | `CreateUserDto` |
| Update DTO | `Update` + `PascalCase` + `Dto` | `UpdateUserDto` |
| Query DTO | `Query` + `PascalCase` + `Dto` | `QueryUserDto` |

---

## 10. CLI code generation

```bash
# Scaffold full module for relational DB
npm run generate:resource:relational -- --name Category

# Scaffold full module for document DB
npm run generate:resource:document -- --name Category

# Scaffold for both DB types simultaneously
npm run generate:resource:all-db -- --name Category

# Add a property to existing resource
npm run generate:property:relational -- --module users --name age --type number
```

---

## 11. Forbidden patterns

| Forbidden | Why | Correct alternative |
|-----------|-----|---------------------|
| `@Entity()` / `@Schema()` in `domain/` | DB schema pollutes business model | DB decorators belong in `infrastructure/persistence/*/entities/` |
| `@InjectRepository` in service | Bypasses the port abstraction | Inject abstract `XRepository` class |
| `Repository<XEntity>` in service constructor | Couples service to ORM | Use abstract `XRepository` port |
| Universal `find(condition: any)` in repository | Breaks extension without modification | Single-purpose methods: `findByEmail`, `findById` |
| Returning `XEntity` or `XDocument` from repository | Leaks DB schema to callers | Return domain type via `XMapper.toDomain(entity)` |
| `throw new Error(...)` in service | Wrong shape for frontend error parsing | `throw new UnprocessableEntityException({ status, errors })` |
| `throw new NotFoundException(...)` in service | Wrong shape | Same — use `UnprocessableEntityException` |
| `settings = new ConfigService()` at module level | Untestable singleton | Use NestJS DI: `constructor(private config: ConfigService)` |
| Direct DB query in controller | Skips service logic and validation | Call service methods only |
| Importing sibling module's infrastructure | Cross-module coupling | Import the other module's service instead |
| Hard-coded string error messages in `errors` object | Breaks i18n | Use i18n keys like `'emailAlreadyExists'`, not messages |

---

## 12. File layout checklist for agents

When creating a new file, verify:

- [ ] File is in the correct layer (domain / service / controller / infrastructure)
- [ ] Domain file: no TypeORM/Mongoose/NestJS infrastructure imports
- [ ] Service file: injects abstract repository port, uses `UnprocessableEntityException`
- [ ] Controller file: only calls service methods, uses correct guards/decorators
- [ ] Repository adapter: extends abstract port, all methods return domain types via mapper
- [ ] Mapper: has both `toDomain()` and `toPersistence()` static methods
- [ ] DTO: has `@ApiProperty` / `@ApiPropertyOptional` on all fields
- [ ] Module: registers the concrete repository adapter via the persistence module
- [ ] Test file exists (or is being created alongside the new code)
- [ ] E2E test covers the happy path and at least one error path
