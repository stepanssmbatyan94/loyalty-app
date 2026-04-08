# Conventions — Agent Development Guide

**Date:** 2026-03-13
**Audience:** AI coding agents and developers adding features to this codebase.

This document is the single source of truth for how to make changes. Follow it exactly. Do not invent new patterns — extend existing ones.

---

## 0. Read before touching code

1. The reference implementation is `app/modules/catalog/`. When uncertain about any pattern, read the equivalent file there.
2. The dependency direction is always inward: Infrastructure → Application → Domain → nothing. Never break this.
3. The public surface of a module is its `__init__.py` only. Never import from a module's internal layers directly.
4. All domain code is pure Python. No third-party imports in `domain/` or `application/`.

---

## 1. Adding a new feature to an existing module

Use this checklist when adding a command (write) or query (read) to an existing bounded context.

### 1a. Adding a command (write operation)

- [ ] **Step 1 — Domain:** add the behaviour to the aggregate in `domain/video.py` (or equivalent). The method must call `self.record_event(XEvent(...))` before returning.
- [ ] **Step 2 — Event:** if the command produces a new event, add a frozen dataclass to `domain/events.py` that extends `DomainEvent`. Override `to_dict()`.
- [ ] **Step 3 — Command dataclass:** create `application/commands/your_command.py` with a `@dataclass(frozen=True)` class.
- [ ] **Step 4 — Handler method:** add `async def handle_your_command(self, cmd: YourCommand) -> str` to `CatalogCommandHandlers` in `application/commands/handlers.py`. Follow the pattern: load aggregate → call method → save → publish events.
- [ ] **Step 5 — HTTP schema:** add request/response Pydantic models to `adapters/http/schemas.py`. No domain types here.
- [ ] **Step 6 — HTTP route:** add a route to `adapters/http/router.py` that maps HTTP → command → handler → response.
- [ ] **Step 7 — Module public API:** export the new command from `__init__.py` if external callers need it.
- [ ] **Step 8 — Tests:** write BDD-style tests:
  - Domain: add a `When{Context}` class with `it_{outcome}` methods to `tests/modules/X/domain/test_{aggregate}.py` — happy path, event recording, guard conditions.
  - Application: add a `When{Context}` class with `setup_method` + Fake ports to `tests/modules/X/application/test_command_handlers.py`.
  - HTTP acceptance (optional): add a `Scenario` block to `tests/features/X/{command}.feature`.

### 1b. Adding a query (read operation)

- [ ] **Step 1 — Read model:** define a `@dataclass` read model (not a domain aggregate) in `application/queries/your_query.py`.
- [ ] **Step 2 — Query dataclass:** define a `@dataclass(frozen=True)` query in the same file.
- [ ] **Step 3 — Handler method:** add `async def handle_your_query(self, q: YourQuery) -> YourReadModel` to `CatalogQueryHandlers`. Query handlers never mutate state and never publish events.
- [ ] **Step 4 — HTTP schema:** add response Pydantic model to `adapters/http/schemas.py`.
- [ ] **Step 5 — HTTP route:** add a `GET` route to `adapters/http/router.py`.
- [ ] **Step 6 — Tests:** add a `When{Context}` class with Fake ports to `tests/modules/X/application/test_query_handlers.py`. Cover the happy path and the not-found case.

---

## 2. Adding a new bounded context (module)

Use this checklist when a new domain area requires its own module.

### Step 1 — Create the directory skeleton

```bash
mkdir -p app/modules/{name}/domain/ports
mkdir -p app/modules/{name}/application/commands
mkdir -p app/modules/{name}/application/queries
mkdir -p app/modules/{name}/infrastructure/persistence
mkdir -p app/modules/{name}/infrastructure/messaging
mkdir -p app/modules/{name}/infrastructure/consumers
mkdir -p app/modules/{name}/adapters/http
touch app/modules/{name}/__init__.py
touch app/modules/{name}/domain/__init__.py
# ... (all __init__.py files)
```

### Step 2 — Define the aggregate

In `domain/{name}.py`:
- Class must extend `AggregateRoot[XId]` from `shared_kernel`
- All state-changing methods call `self.record_event(...)`
- Factory method is a `@classmethod` named `create`

```python
from __future__ import annotations
from dataclasses import dataclass, field
from app.shared_kernel import AggregateRoot
from app.modules.{name}.domain.value_objects import XId, XName
from app.modules.{name}.domain.events import XCreated

@dataclass(eq=False)
class X(AggregateRoot[XId]):
    name: XName

    @classmethod
    def create(cls, name: XName) -> "X":
        x = cls(id=XId.generate(), name=name)
        x.record_event(XCreated(x_id=str(x.id.value), name=name.value))
        return x
```

### Step 3 — Define value objects

In `domain/value_objects.py`:
- All must be `@dataclass(frozen=True)` extending `ValueObject`
- `XId` must have a `generate() -> XId` classmethod using `uuid.uuid4()`
- Validate in `__post_init__`, raise `DomainError` on violation

### Step 4 — Define domain events

In `domain/events.py`:
- All must be `@dataclass(frozen=True)` extending `DomainEvent`
- Named in past tense: `XCreated`, `XUpdated`, `XDeleted`
- Override `to_dict()` to include all fields

### Step 5 — Define ports

In `domain/ports/x_repository.py`:
```python
from abc import ABC, abstractmethod
from app.modules.{name}.domain.{name} import X, XId

class IXRepository(ABC):
    @abstractmethod
    async def get_by_id(self, x_id: XId) -> X: ...
    @abstractmethod
    async def save(self, x: X) -> None: ...
    @abstractmethod
    async def delete(self, x_id: XId) -> None: ...
    @abstractmethod
    async def find_all(self, limit: int = 20, offset: int = 0) -> list[X]: ...
```

In `domain/ports/event_publisher.py` — copy from `catalog` verbatim, change nothing.

### Step 6 — Write commands and queries

Follow section 1a and 1b above.

### Step 7 — Implement infrastructure

In `infrastructure/persistence/postgres_x_repository.py`:
- Implement all `IXRepository` methods
- Use the shared async Postgres engine and explicit SQLAlchemy Core statements
- Always call `VideoRecordMapper` equivalent for domain ↔ row mapping

In `infrastructure/messaging/sns_event_publisher.py` — copy from `catalog` verbatim.

In `infrastructure/consumers/sqs_x_consumer.py`:
- Must use the `supervised_run()` pattern (restart on crash)
- Must log exceptions with `logger.exception()`
- Must `delete_message` on success, leave on failure (DLQ handles retries)

In `infrastructure/__init__.py`:
```python
def build_x_container(settings: Settings, engine: AsyncEngine) -> dict[str, object]:
    repo = PostgresXRepository(engine=engine)
    publisher = SnsEventPublisher(topic_arn=settings.x_sns_topic_arn, region=settings.aws_region)
    consumer = SqsXConsumer(queue_url=settings.x_sqs_queue_url, handlers=...)
    return {
        "x_cmd": XCommandHandlers(repo=repo, publisher=publisher),
        "x_qry": XQueryHandlers(repo=repo),
        "x_consumer": consumer,
    }
```

### Step 8 — Write HTTP adapter

In `adapters/http/schemas.py`:
- Only Pydantic v2 models (`BaseModel`)
- Never import domain types
- Mirror the command/query dataclasses in HTTP form

In `adapters/http/router.py`:
- `APIRouter(prefix="/api/v1/{name}", tags=["{name}"])`
- Access handlers via `request.app.state.x_cmd` / `request.app.state.x_qry`
- Map: HTTP body → command → handler → response schema

### Step 9 — Export from module `__init__.py`

Follow the `catalog/__init__.py` template exactly. Export:
- All command dataclasses
- `XCommandHandlers`
- All query dataclasses
- `XQueryHandlers`
- All domain events
- `x_router`
- `build_x_container`
- Declare `__all__`

### Step 10 — Register in the app

In `app/api/v1/router.py`:
```python
from app.modules.{name} import x_router
router.include_router(x_router)
```

In `app/main.py` lifespan:
```python
app.state.update(build_x_container(settings, db))
consumers.append(asyncio.create_task(app.state.x_consumer.supervised_run()))
```

In `app/core/config.py`:
```python
x_sns_topic_arn: str = ""
x_sqs_queue_url: str = ""
```

### Step 11 — Write tests (BDD style)

Tests use `When{Context}` classes with `it_{outcome}` methods — not `TestXxx`/`test_xxx`.

Create `tests/modules/{name}/domain/test_{name}.py`:
- One `When{Context}` class per scenario (e.g. `WhenCreatingAnX`, `WhenUpdatingAnX`, `WhenXIsInvalid`)
- Cover happy path, event recording, guard conditions, and `pull_events()` clearing
- Add Hypothesis `WhenX` classes for value object boundary invariants

Create `tests/modules/{name}/application/test_command_handlers.py`:
- Define `FakeXRepository` and `FakeEventPublisher` at the top of the file
- One `When{Context}` class per distinct command scenario; each class owns a `setup_method`
- Cover: successful case, event published, error case, no event on error

Create `tests/modules/{name}/application/test_query_handlers.py`:
- Define `FakeXRepository` at the top
- One `When{Context}` class per query scenario (found, not-found, filtered list)

Create `tests/features/{name}/` (optional, for HTTP acceptance):
- `.feature` files with `Given/When/Then` Gherkin scenarios
- Step definitions in `test_{scenario}.py` using `pytest-bdd`

---

## 3. Naming conventions

| Item | Convention | Example |
|------|-----------|---------|
| Module directory | `snake_case` | `catalog`, `streaming`, `ingest` |
| Aggregate class | `PascalCase` noun | `Video`, `PlaybackSession`, `IngestJob` |
| Value object class | `PascalCase` noun | `VideoId`, `Title`, `Bitrate` |
| Domain event class | `PascalCase` past tense | `VideoCreated`, `SessionEnded` |
| Command dataclass | `PascalCase` imperative + `Command` | `CreateVideoCommand` |
| Query dataclass | `PascalCase` + `Query` | `GetVideoQuery` |
| Read model | `PascalCase` + `ReadModel` | `VideoReadModel` |
| Port interface | `I` prefix | `IVideoRepository`, `IEventPublisher` |
| Infrastructure adapter | Concrete noun | `PostgresVideoRepository`, `SnsEventPublisher` |
| HTTP schema | Descriptive + `Request`/`Response` | `CreateVideoRequest`, `VideoResponse` |
| Handler class | Module name + `CommandHandlers` / `QueryHandlers` | `CatalogCommandHandlers` |
| State key | `{module}_{role}` | `catalog_cmd`, `catalog_qry`, `catalog_consumer` |

---

## 4. Forbidden patterns

These are not style preferences. They are correctness violations.

| Forbidden | Why | Correct alternative |
|-----------|-----|---------------------|
| `from app.modules.streaming import ...` inside `app/modules/catalog/` | Cross-module coupling | Subscribe to SNS events; define a local read model |
| `from sqlalchemy import ...` in `domain/` or `application/` | Infrastructure leak | Define an `IRepository` port in `domain/ports/` |
| `from fastapi import ...` in `domain/` or `application/` | Infrastructure leak | Use ports; call from `adapters/http/router.py` |
| `asyncio.create_task(consumer.run())` without `supervised_run()` | Silent failure on crash | Always use `supervised_run()` |
| `allow_origins=["*"]` with `allow_credentials=True` | CORS spec violation | Use specific origins or drop credentials |
| `settings = Settings()` at module level | Untestable singleton | Use `@lru_cache` function `get_settings()` |
| Returning a domain aggregate from a query handler | Leaks domain model | Return a `ReadModel` dataclass |
| Importing `domain.X` types in `adapters/http/schemas.py` | Couples HTTP to domain | Use Pydantic schemas; map manually in route handler |
| `def handle_create(...)` without `async` | Blocks event loop | Always `async def` |

---

## 5. File layout checklist for agents

When an agent creates a new file, verify:

- [ ] The file is in the correct layer (domain / application / infrastructure / adapters)
- [ ] The imports respect the dependency direction table in `docs/architecture.md`
- [ ] If in `domain/`: no third-party imports
- [ ] If in `application/`: no SQLAlchemy, boto3, FastAPI imports
- [ ] If adding an aggregate method: `record_event()` is called
- [ ] If adding a command handler: `pull_events()` and `publish` are called after `save()`
- [ ] If adding an infrastructure adapter: it extends the correct port ABC
- [ ] If creating a new domain event: it extends `DomainEvent` and overrides `to_dict()`
- [ ] The corresponding test file exists or is created
