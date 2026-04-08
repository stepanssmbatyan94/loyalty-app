# Architecture: Hexagonal DDD Modules

**Status:** Accepted
**Date:** 2026-03-13
**Author:** Senior Software Architect

---

## 1. Philosophy

This project is structured around three compounding principles:

1. **Hexagonal Architecture (Ports & Adapters)** — the domain and application layers know nothing about how they are called or what external systems they talk to. All external concerns are expressed as interfaces (ports) and implemented by infrastructure (adapters). This makes the core independently testable and replaceable.

2. **Domain-Driven Design (DDD)** — each bounded context owns its domain model completely. Entities, aggregates, value objects, and domain events live in the domain layer, are written in the language of the domain, and carry no infrastructure concerns.

3. **Agentic-development-friendly modules** — every bounded context is a closed, self-describing unit. An AI agent given one module directory has everything it needs to extend that module without reading any other module. Conventions are explicit, enforced structurally, and documented here.

---

## 2. Bounded context map

The platform has four bounded contexts. Each is an independent module under `app/modules/`.

```
┌─────────────────┐     domain events     ┌─────────────────┐
│    CATALOG      │ ─────────────────────▶ │   STREAMING     │
│                 │                        │                 │
│ Video metadata  │                        │ Playback        │
│ Assets          │ ◀───────────────────── │ sessions        │
└─────────────────┘     domain events     └─────────────────┘
         │                                          │
         │ domain events                domain events
         ▼                                          ▼
┌─────────────────┐                     ┌─────────────────┐
│    INGEST       │                     │    IDENTITY     │
│                 │                     │                 │
│ Upload pipeline │                     │ Users / auth    │
│ Transcoding     │                     │ Permissions     │
└─────────────────┘                     └─────────────────┘

Modules communicate ONLY via domain events published to SNS/SQS.
No module imports from another module's domain/ or application/.
```

---

## 3. Hexagonal architecture — per module

Each module has an identical internal structure. The dependency arrow always points inward — toward the domain.

```
┌──────────────────────────────────────────────────────────────────────┐
│  Module (e.g. catalog)                                               │
│                                                                      │
│  Inbound Adapters         Application           Outbound Adapters    │
│  ┌──────────────┐        ┌────────────────┐    ┌──────────────────┐ │
│  │ HTTP Router  │──────▶ │  Command       │──▶ │ Postgres         │ │
│  │ SQS Consumer │        │  Handlers      │    │ Repository       │ │
│  │ KDS Consumer │        │                │    │                  │ │
│  └──────────────┘        │  Query         │──▶ │ SNS Publisher    │ │
│                          │  Handlers      │    │                  │ │
│                          └───────┬────────┘    └──────────────────┘ │
│                                  │ calls                             │
│                          ┌───────▼────────┐                         │
│                          │    DOMAIN      │                         │
│                          │  Aggregate     │  ◀ ports defined here   │
│                          │  Entity        │    adapters implement   │
│                          │  ValueObject   │    them in infra/       │
│                          │  DomainEvent   │                         │
│                          │  Ports (ABCs)  │                         │
│                          └────────────────┘                         │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 4. Directory structure

```
app/
├── main.py                          # Composition root — wires all containers, lifespan
├── core/
│   ├── config.py                    # pydantic-settings; lru_cache; all env vars
│   └── logging.py                   # structlog setup; stdlib bridge for CloudWatch
│
├── shared_kernel/                   # Cross-cutting primitives — NO business logic
│   ├── __init__.py                  # Re-exports all public types
│   ├── domain/
│   │   ├── entity.py                # Entity[IdT] — equality by identity
│   │   ├── aggregate_root.py        # AggregateRoot[IdT] — pull_events()
│   │   ├── value_object.py          # ValueObject — frozen, equality by value
│   │   ├── domain_event.py          # DomainEvent — immutable, to_dict() for SNS
│   │   └── exceptions.py            # DomainError, NotFoundError, ConflictError
│   └── application/
│       ├── event_bus.py             # EventBus ABC + InMemoryEventBus
│       ├── command_bus.py           # CommandBus ABC + SimpleCommandBus
│       └── query_bus.py             # QueryBus ABC + SimpleQueryBus
│
├── modules/
│   ├── catalog/
│   │   ├── __init__.py              # ← MODULE PUBLIC API (only import from here)
│   │   ├── domain/
│   │   │   ├── video.py             # Video aggregate root
│   │   │   ├── value_objects.py     # VideoId, Title, VideoStatus, Tags
│   │   │   ├── events.py            # VideoCreated, VideoPublished, VideoDeleted
│   │   │   └── ports/
│   │   │       ├── video_repository.py   # IVideoRepository ABC (outbound port)
│   │   │       └── event_publisher.py    # IEventPublisher ABC (outbound port)
│   │   ├── application/
│   │   │   ├── commands/
│   │   │   │   ├── create_video.py       # CreateVideoCommand dataclass
│   │   │   │   ├── publish_video.py      # PublishVideoCommand dataclass
│   │   │   │   ├── delete_video.py       # DeleteVideoCommand dataclass
│   │   │   │   └── handlers.py           # CatalogCommandHandlers
│   │   │   └── queries/
│   │   │       ├── get_video.py          # GetVideoQuery dataclass
│   │   │       ├── list_videos.py        # ListVideosQuery dataclass
│   │   │       └── handlers.py           # CatalogQueryHandlers
│   │   ├── infrastructure/
│   │   │   ├── __init__.py              # build_catalog_container() factory
│   │   │   ├── persistence/
│   │   │   │   ├── postgres_video_repository.py
│   │   │   │   └── video_record_mapper.py
│   │   │   ├── messaging/
│   │   │   │   └── sns_event_publisher.py
│   │   │   └── consumers/
│   │   │       └── sqs_catalog_consumer.py
│   │   └── adapters/
│   │       └── http/
│   │           ├── router.py             # FastAPI APIRouter (inbound adapter)
│   │           └── schemas.py            # Pydantic request/response models
│   │
│   ├── streaming/                   # Same structure — see catalog as reference
│   ├── ingest/                      # Same structure
│   └── identity/                    # Same structure
│
└── api/
    └── v1/
        ├── router.py                # Assembles all module routers
        └── health.py                # Liveness + readiness probes

tests/
├── conftest.py
└── modules/
    └── catalog/
        ├── domain/
        │   └── test_video.py        # Unit tests — pure domain, no mocks needed
        ├── application/
        │   ├── test_command_handlers.py  # Stub ports, no real DB/AWS
        │   └── test_query_handlers.py
        └── infrastructure/
            └── test_postgres_video_repository.py
```

---

## 5. Dependency rules

Violations of these rules are bugs, not style issues.

| Layer | Allowed imports | Forbidden |
|-------|----------------|-----------|
| `shared_kernel/domain/` | `abc`, `dataclasses`, `uuid`, `datetime`, `typing` | All third-party; all `app.*` |
| `shared_kernel/application/` | `shared_kernel/domain/` + stdlib | Infrastructure; modules |
| `modules/X/domain/` | `shared_kernel/domain/` + stdlib | Other modules; infrastructure; FastAPI; SQLAlchemy; boto3 |
| `modules/X/application/` | `modules/X/domain/`, `shared_kernel/` | Other modules' internals; infrastructure |
| `modules/X/infrastructure/` | `modules/X/domain/`, `modules/X/application/`, third-party | Other modules' domain/application |
| `modules/X/adapters/http/` | `modules/X/application/`, `modules/X/__init__`, FastAPI | Other modules' internals; domain directly |
| `modules/X/__init__.py` | Anything within `modules/X/` | No restriction — this IS the boundary |
| `api/v1/router.py` | `modules/X/__init__` (via `x_router` export) | Module internals |
| `app/main.py` | `api/`, `core/`, `modules/X/__init__` | Module internals |

**One rule in plain language:** if you are inside `modules/catalog/` and you write `from app.modules.streaming`, you have broken the architecture.

---

## 6. Domain layer

The domain layer contains pure business logic. It must be testable without pytest fixtures, mocks, or a running database.

### Aggregate Root

The central object in a bounded context. It is the only entry point for state changes. It collects domain events and exposes them via `pull_events()`.

```python
# Pattern — every aggregate follows this shape
class Video(AggregateRoot[VideoId]):

    @classmethod
    def create(cls, title: Title, owner_id: str) -> "Video":
        video = cls(id=VideoId.generate(), title=title, owner_id=owner_id, ...)
        video.record_event(VideoCreated(video_id=str(video.id.value), ...))
        return video

    def publish(self) -> None:
        if self.status != VideoStatus.DRAFT:
            raise DomainError("only draft videos can be published")
        self.status = VideoStatus.PUBLISHED
        self.record_event(VideoPublished(video_id=str(self.id.value)))
```

### Value Objects

Immutable. Equality by value. All validation at construction time.

```python
@dataclass(frozen=True)
class Title(ValueObject):
    value: str

    def __post_init__(self) -> None:
        if not self.value or len(self.value) > 200:
            raise DomainError("title must be between 1 and 200 characters")
```

### Domain Events

Immutable records of things that happened. Named in past tense. Carry only the data needed by subscribers.

```python
@dataclass(frozen=True)
class VideoCreated(DomainEvent):
    video_id: str
    title: str
    owner_id: str

    def to_dict(self) -> dict[str, object]:
        return {**super().to_dict(), "video_id": self.video_id, ...}
```

### Ports (outbound interfaces)

Defined in `domain/ports/`. Never import from infrastructure. These are the contracts the domain defines and infrastructure fulfils.

```python
class IVideoRepository(ABC):
    @abstractmethod
    async def get_by_id(self, video_id: VideoId) -> Video: ...

    @abstractmethod
    async def save(self, video: Video) -> None: ...
```

---

## 7. Application layer

The application layer orchestrates the domain. It knows about ports but not about concrete adapters.

### Commands (write)

A command is an instruction to do something. It may fail. It changes state.

```python
@dataclass(frozen=True)
class CreateVideoCommand:
    title: str
    owner_id: str
    tags: list[str] = field(default_factory=list)
```

The handler validates input, calls the aggregate, persists, and publishes events:

```python
class CatalogCommandHandlers:
    def __init__(self, repo: IVideoRepository, publisher: IEventPublisher) -> None:
        self._repo = repo
        self._publisher = publisher

    async def handle_create_video(self, cmd: CreateVideoCommand) -> str:
        video = Video.create(title=Title(cmd.title), owner_id=cmd.owner_id)
        await self._repo.save(video)
        for event in video.pull_events():
            await self._publisher.publish(event)
        return str(video.id.value)
```

### Queries (read)

A query never changes state. It returns a plain dataclass, never a domain aggregate.

```python
@dataclass(frozen=True)
class GetVideoQuery:
    video_id: str

@dataclass
class VideoReadModel:
    id: str
    title: str
    status: str
    created_at: datetime

class CatalogQueryHandlers:
    async def handle_get_video(self, q: GetVideoQuery) -> VideoReadModel: ...
```

---

## 8. Infrastructure layer

Infrastructure implements the ports. It knows about SQLAlchemy, boto3, and FastAPI. The domain and application layers never see these.

### Repository adapter

```python
class PostgresVideoRepository(IVideoRepository):
    def __init__(self, engine: AsyncEngine) -> None:
        self._engine = engine

    async def save(self, video: Video) -> None:
        ...

    async def get_by_id(self, video_id: VideoId) -> Video:
        row = ...
        if row is None:
            raise NotFoundError(f"Video {video_id.value} not found")
        return VideoRecordMapper.from_record(row)
```

### Event publisher adapter

```python
class SnsEventPublisher(IEventPublisher):
    def __init__(self, topic_arn: str, region: str) -> None:
        self._topic_arn = topic_arn
        self._sns = boto3.client("sns", region_name=region)

    async def publish(self, event: DomainEvent) -> None:
        await asyncio.to_thread(
            self._sns.publish,
            TopicArn=self._topic_arn,
            Message=json.dumps(event.to_dict()),
            MessageAttributes={
                "event_type": {"DataType": "String", "StringValue": event.event_type}
            },
        )
```

### Container factory

Each module's `infrastructure/__init__.py` exports a `build_X_container(settings, engine)` function. This is called once during lifespan startup and stored in `app.state`. All other wiring happens here.

---

## 9. Inbound adapters

### HTTP adapter

The HTTP router is the inbound adapter for REST calls. It translates HTTP request → command/query → HTTP response. It never imports domain types directly.

```python
router = APIRouter(prefix="/api/v1/catalog", tags=["catalog"])

@router.post("/videos", status_code=201, response_model=VideoResponse)
async def create_video(body: CreateVideoRequest, req: Request) -> VideoResponse:
    handlers: CatalogCommandHandlers = req.app.state.catalog_cmd
    video_id = await handlers.handle_create_video(
        CreateVideoCommand(title=body.title, owner_id=body.owner_id)
    )
    return VideoResponse(id=video_id)
```

### SQS consumer adapter

The SQS consumer is the inbound adapter for event-driven calls. It translates SQS message → command → handler call. It uses a supervised restart loop.

```python
class SqsCatalogConsumer:
    async def supervised_run(self) -> None:
        while True:
            try:
                await self._run()
            except Exception:
                logger.exception("SQS consumer crashed — restarting in 5 s")
                await asyncio.sleep(5)
```

---

## 10. Composition root (`main.py`)

`main.py` is the only place where concrete adapters are wired to ports. All other code works with abstractions.

```python
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # 1. Infrastructure connections
    postgres_engine = create_postgres_engine(settings.postgres_dsn)

    # 2. Wire each module container
    app.state.update(build_catalog_container(settings, postgres_engine))
    app.state.update(build_streaming_container(settings, postgres_engine))
    app.state.update(build_ingest_container(settings, postgres_engine))
    app.state.update(build_identity_container(settings, postgres_engine))

    # 3. Start background consumers as supervised tasks
    consumers = [
        asyncio.create_task(app.state.catalog_consumer.supervised_run()),
        asyncio.create_task(app.state.streaming_consumer.supervised_run()),
    ]

    logger.info("All modules started")
    yield

    # 4. Graceful shutdown
    for task in consumers:
        task.cancel()
    await postgres_engine.dispose()
```

---

## 11. Inter-module communication

Modules never import from each other's domain or application layers. They communicate exclusively through domain events published to SNS and consumed via SQS.

```
catalog module                          streaming module
     │                                        │
     │  VideoPublished event                  │
     │  (SNS → SQS)                          │
     └──────────────────────────────────────▶│
                                             │  Receives event
                                             │  Creates StreamingAsset
                                             │  (own domain object)
```

The only cross-module import allowed is a shared `DomainEvent` subclass, imported from `shared_kernel`. Never import `VideoPublished` from `modules.catalog` into `modules.streaming` — instead, define a local `CatalogVideoPublishedEvent` in streaming that mirrors the wire format.

---

## 12. Testing strategy

| Test type | Location | Dependencies | What is tested |
|-----------|----------|-------------|----------------|
| Domain unit | `tests/modules/X/domain/` | None (pure Python) | Aggregate invariants, value object validation, event recording |
| Application unit | `tests/modules/X/application/` | Stub/fake ports | Command handler orchestration, query handler logic |
| Infrastructure integration | `tests/modules/X/infrastructure/` | Postgres container, LocalStack | Repository correctness, SNS message shape |
| HTTP integration | `tests/modules/X/` (via TestClient) | Full container | Route → handler → response |
| Property-based | In domain unit tests | Hypothesis | Invariant holds for all valid inputs |

**Key principle:** domain tests require no test infrastructure. A developer can run `pytest tests/modules/catalog/domain/` with no `.env`, no Docker, no AWS credentials.

---

## 13. Adding a new bounded context

See `docs/conventions.md` for the step-by-step agent-friendly checklist.

The short version:
1. Create the directory structure (copy `catalog/` skeleton)
2. Define the aggregate root, value objects, and domain events in `domain/`
3. Define repository and publisher ports in `domain/ports/`
4. Write command and query dataclasses in `application/`
5. Write command and query handlers in `application/*/handlers.py`
6. Implement infrastructure adapters
7. Write `build_X_container()` in `infrastructure/__init__.py`
8. Write HTTP router and schemas in `adapters/http/`
9. Export public API from module `__init__.py`
10. Register router and container in `api/v1/router.py` and `main.py`
11. Add config keys to `core/config.py`
12. Write tests following the four-layer test strategy

The `catalog` module is the canonical reference implementation. When uncertain, follow what `catalog` does.
