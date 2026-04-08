# Infrastructure Layer Rules

You are editing the **infrastructure layer** — the outermost ring. This layer implements the repository ports, maps between DB records and domain entities, and wires everything into NestJS modules. It is the only place where TypeORM/Mongoose may appear.

## What lives in infrastructure

```
src/{module}/infrastructure/persistence/
├── {module}.repository.ts                     ← abstract port (no DB logic here)
├── relational/
│   ├── entities/{entity}.entity.ts            ← TypeORM @Entity with @Column decorators
│   ├── mappers/{entity}.mapper.ts             ← toDomain() / toPersistence()
│   ├── repositories/{entity}.repository.ts   ← implements abstract port
│   └── relational-persistence.module.ts
└── document/
    ├── entities/{schema}.schema.ts            ← Mongoose @Schema with @Prop decorators
    ├── mappers/{schema}.mapper.ts
    ├── repositories/{schema}.repository.ts
    └── document-persistence.module.ts
```

## Allowed in this layer

- TypeORM: `@Entity`, `@Column`, `@PrimaryGeneratedColumn`, relations, `Repository<XEntity>`, `@InjectRepository`
- Mongoose: `@Schema`, `@Prop`, `Model<XDocument>`, `@InjectModel`
- NestJS: `@Injectable`, `@Module`

## Forbidden — these are bugs

| Forbidden | Why | Correct alternative |
|-----------|-----|---------------------|
| Business logic in repository methods | Repositories are persistence-only | Move to service layer |
| `bcrypt`, `jwt`, or crypto in repositories | Security concerns belong in services | Services handle hashing before calling `repo.create()` |
| Returning `XEntity` (TypeORM) or `XDocument` (Mongoose) from a repository | Leaks DB schema to service layer | Always map to domain entity via mapper before returning |
| Universal `find(condition: UniversalInterface)` | Hard to extend without breaking callers | Create focused methods: `findByEmail`, `findByIds`, `findByRole` |
| Cross-module infrastructure imports | Each module owns its own adapters | Import only from own module's infrastructure |
| Direct calls to another module's repository | Bypass the service/port boundary | Call the other module's service instead |

## Repository adapter pattern

The adapter class extends the abstract port and implements all its methods:

```typescript
// ✅ Correct — relational adapter
@Injectable()
export class UsersRelationalRepository implements UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'deletedAt'>): Promise<User> {
    const entity = this.usersRepository.create(
      UserMapper.toPersistence(data as User),
    );
    const saved = await this.usersRepository.save(entity);
    return UserMapper.toDomain(saved);   // ← always return domain object
  }

  async findByEmail(email: User['email']): Promise<NullableType<User>> {
    if (!email) return null;
    const entity = await this.usersRepository.findOne({ where: { email } });
    return entity ? UserMapper.toDomain(entity) : null;
  }
}
```

## Mapper pattern

Mappers are static utility classes — no injection, no state:

```typescript
export class UserMapper {
  static toDomain(raw: UserEntity): User {
    const domain = new User();
    domain.id = raw.id;
    domain.email = raw.email;
    domain.firstName = raw.firstName;
    domain.createdAt = raw.createdAt;
    // ... map all fields
    return domain;
  }

  static toPersistence(domain: User): UserEntity {
    const entity = new UserEntity();
    entity.id = domain.id as number;
    entity.email = domain.email;
    entity.firstName = domain.firstName;
    // ... map all fields
    return entity;
  }
}
```

**Rules:**
- `toDomain()` always returns a domain class instance (from `domain/`)
- `toPersistence()` always returns a DB entity/schema instance
- Never return `undefined` — use `null` for optional absent values

## Single-responsibility repository methods

```typescript
// ❌ Wrong — universal condition is hard to extend
async find(condition: UniversalConditionInterface): Promise<User[]> { ... }

// ✅ Correct — one method per query shape
async findByEmail(email: string): Promise<NullableType<User>> { ... }
async findByIds(ids: User['id'][]): Promise<User[]> { ... }
async findManyWithPagination({ filterOptions, sortOptions, paginationOptions }): Promise<User[]> { ... }
```

## Quick checklist before saving

- [ ] Repository adapter returns domain types (via mapper), never raw DB entities
- [ ] No business logic (hashing, validation) inside repository methods
- [ ] All declared abstract methods from the port are implemented
- [ ] Mapper has both `toDomain()` and `toPersistence()` static methods
