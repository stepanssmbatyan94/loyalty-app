---
name: minolta-python
description: >
  Guides writing clean Python code and tests for the minolta-be project.
  Use this skill whenever you are adding features, fixing bugs, writing tests,
  reviewing code, or creating new bounded contexts in the minolta-be codebase.
  Triggers on tasks like "add a command handler", "write tests for", "create a
  value object", "implement a new bounded context", "review my domain model",
  "add a Hypothesis test", "write a fake repository", or any time the user
  asks about Python code quality, DDD patterns, hexagonal architecture,
  pytest conventions, or testing strategy for this project.
---

# minolta-python: Clean Code & Testing Guide

## Stack at a glance

- Python 3.13, FastAPI 0.115, pydantic-settings 2.x
- pytest + Hypothesis + pytest-mock
- Hexagonal DDD, 4 bounded contexts: `catalog`, `streaming`, `ingest`, `identity`
- Shared kernel: `app/shared_kernel/` (Entity, AggregateRoot, ValueObject, DomainEvent, buses)
- Modules: `app/modules/{context}/domain|application|infrastructure|adapters/`
- Authoritative design docs: `docs/architecture.md`, `docs/conventions.md`

---

## 1. Dependency rules (enforced like correctness, not style)

The dependency arrow always points **inward toward the domain**. Violations are bugs.

| Layer | May import | Never imports |
|---|---|---|
| `shared_kernel/domain/` | `abc`, `dataclasses`, `uuid`, `datetime`, `typing` | All third-party; all `app.*` |
| `modules/X/domain/` | `shared_kernel/domain/` + stdlib | Other modules; infra; FastAPI; motor; boto3 |
| `modules/X/application/` | `modules/X/domain/`, `shared_kernel/` | Other modules' internals; infrastructure |
| `modules/X/infrastructure/` | domain + application + third-party | Other modules' domain/application |
| `modules/X/adapters/http/` | `modules/X/application/`, FastAPI | Domain directly; other module internals |

**Cross-module communication is via SNS/SQS only.** Never `from app.modules.streaming import ...` inside `catalog`. If you need a shared event type, define a local mirror in `shared_kernel` or the receiving module — never import domain classes across module boundaries.

---

## 2. Domain layer patterns

### Aggregate Root

The only entry point for state changes. Every mutating method records a domain event.

```python
@dataclass(eq=False)
class Video(AggregateRoot[VideoId]):

    @classmethod
    def create(cls, title: Title, owner_id: str) -> "Video":
        video = cls(id=VideoId.generate(), title=title, owner_id=owner_id, status=VideoStatus.DRAFT)
        video.record_event(VideoCreated(video_id=str(video.id.value), title=title.value, owner_id=owner_id))
        return video

    def publish(self) -> None:
        if self.status != VideoStatus.DRAFT:
            raise DomainError("only draft videos can be published")
        self.status = VideoStatus.PUBLISHED
        self.record_event(VideoPublished(video_id=str(self.id.value)))
```

Key rules:
- Factory method is always a `@classmethod` named `create`
- Every state-changing method calls `self.record_event(...)` before returning
- Raise `DomainError` (from `shared_kernel`) for invariant violations — never `ValueError` or `AssertionError`
- `@dataclass(eq=False)` — equality is by identity (inherited from `Entity`), not attributes

### Value Object

Immutable. Equality by value. All validation in `__post_init__`.

```python
@dataclass(frozen=True)
class Title(ValueObject):
    value: str

    def __post_init__(self) -> None:
        if not self.value or len(self.value) > 200:
            raise DomainError("title must be between 1 and 200 characters")
```

- Always `@dataclass(frozen=True)`
- `XId` value objects must have a `generate() -> "XId"` classmethod using `uuid.uuid4()`
- Validate all business constraints in `__post_init__`, raise `DomainError`

### Domain Event

Immutable. Named in **past tense**. Override `to_dict()` with all fields for SNS serialisation.

```python
@dataclass(frozen=True)
class VideoCreated(DomainEvent):
    video_id: str
    title: str
    owner_id: str

    def to_dict(self) -> dict[str, object]:
        return {**super().to_dict(), "video_id": self.video_id, "title": self.title, "owner_id": self.owner_id}
```

### Port (outbound interface)

Defined in `domain/ports/`. Abstract base class only. No infrastructure imports.

```python
class IVideoRepository(ABC):
    @abstractmethod
    async def get_by_id(self, video_id: VideoId) -> Video: ...

    @abstractmethod
    async def save(self, video: Video) -> None: ...
```

---

## 3. Application layer patterns

### Command (write)

```python
@dataclass(frozen=True)
class CreateVideoCommand:
    title: str
    owner_id: str
    tags: list[str] = field(default_factory=list)
```

### Command handler — always follow this sequence

1. Load aggregate from repository
2. Call aggregate method (or factory for create)
3. Save aggregate
4. Pull events with `pull_events()`
5. Publish each event

```python
async def handle_create_video(self, cmd: CreateVideoCommand) -> str:
    video = Video.create(title=Title(cmd.title), owner_id=cmd.owner_id)
    await self._repo.save(video)
    for event in video.pull_events():
        await self._publisher.publish(event)
    return str(video.id.value)
```

### Query handler

Never mutates state. Never returns a domain aggregate — always returns a `ReadModel` dataclass.

```python
@dataclass
class VideoReadModel:
    id: str
    title: str
    status: str

async def handle_get_video(self, q: GetVideoQuery) -> VideoReadModel: ...
```

---

## 4. Naming conventions

| Item | Convention | Example |
|---|---|---|
| Aggregate | `PascalCase` noun | `Video`, `PlaybackSession` |
| Value object | `PascalCase` noun | `VideoId`, `Title`, `Bitrate` |
| Domain event | `PascalCase` past tense | `VideoCreated`, `SessionEnded` |
| Command | `PascalCase` imperative + `Command` | `CreateVideoCommand` |
| Query | `PascalCase` + `Query` | `GetVideoQuery` |
| Read model | `PascalCase` + `ReadModel` | `VideoReadModel` |
| Port interface | `I` prefix | `IVideoRepository` |
| Infrastructure adapter | Concrete noun | `DocumentDbVideoRepository` |
| HTTP schema | + `Request`/`Response` | `CreateVideoRequest`, `VideoResponse` |
| Handler class | Module + `CommandHandlers`/`QueryHandlers` | `CatalogCommandHandlers` |
| App state key | `{module}_{role}` | `catalog_cmd`, `catalog_qry` |

---

## 5. Testing conventions — BDD style

Tests are living behavior specifications. Each test describes one scenario: in what context,
under what action, with what outcome.

### Five test types

| Type | Location | Pattern |
|---|---|---|
| Domain unit | `tests/modules/X/domain/` | `When/It` classes, pure Python, no mocks |
| Application unit | `tests/modules/X/application/` | `When/It` classes + Fake port implementations |
| Infrastructure integration | `tests/modules/X/infrastructure/` | `mongomock-motor`, LocalStack stubs |
| HTTP acceptance | `tests/features/{module}/` | `pytest-bdd` + Gherkin `.feature` files |
| Property-based | Inside `When` classes in domain tests | Hypothesis `@given` |

**Key principle:** domain and application tests require no `.env`, no Docker, no AWS.

### Domain unit tests — When/It BDD structure

```python
class WhenPublishingADraftVideo:
    def it_changes_status_to_published(self) -> None:
        # Given
        video = Video.create(title=Title("My Video"), owner_id="u-1")
        video.pull_events()
        # When
        video.publish()
        # Then
        assert video.status == VideoStatus.PUBLISHED

    def it_records_a_video_published_event(self) -> None:
        video = Video.create(title=Title("My Video"), owner_id="u-1")
        video.pull_events()
        video.publish()
        events = video.pull_events()
        assert len(events) == 1
        assert isinstance(events[0], VideoPublished)


class WhenPublishingANonDraftVideo:
    def it_raises_a_domain_error(self) -> None:
        # Given — already published
        video = Video.create(title=Title("My Video"), owner_id="u-1")
        video.publish()
        video.pull_events()
        # When / Then
        with pytest.raises(DomainError, match="only draft"):
            video.publish()

    def it_records_no_event(self) -> None:
        video = Video.create(title=Title("My Video"), owner_id="u-1")
        video.publish()
        video.pull_events()
        with pytest.raises(DomainError):
            video.publish()
        assert video.pull_events() == []
```

Naming rules:
- Class: `When{PascalCaseCondition}` — the scenario context
- Method: `it_{natural_language_outcome}` — the expected outcome (no `test_` prefix)
- One behavior per method

### Application unit tests — in-memory fakes + When/It

Fakes are defined at the top of the test file. Each `When` class owns its `setup_method`.

```python
class FakeVideoRepository(IVideoRepository):
    def __init__(self) -> None:
        self._store: dict[str, Video] = {}

    async def save(self, video: Video) -> None:
        self._store[str(video.id.value)] = video

    async def get_by_id(self, video_id: VideoId) -> Video:
        try:
            return self._store[str(video_id.value)]
        except KeyError:
            raise NotFoundError(f"Video {video_id.value} not found")

    async def delete(self, video_id: VideoId) -> None:
        self._store.pop(str(video_id.value), None)

    async def find_all(self, limit: int = 20, offset: int = 0) -> list[Video]:
        return list(self._store.values())[offset : offset + limit]


class FakeEventPublisher(IEventPublisher):
    def __init__(self) -> None:
        self.published: list[DomainEvent] = []

    async def publish(self, event: DomainEvent) -> None:
        self.published.append(event)


class WhenHandlingCreateVideoWithValidData:
    def setup_method(self) -> None:
        self.repo = FakeVideoRepository()
        self.publisher = FakeEventPublisher()
        self.handlers = CatalogCommandHandlers(repo=self.repo, publisher=self.publisher)

    @pytest.mark.asyncio
    async def it_persists_the_new_video(self) -> None:
        cmd = CreateVideoCommand(title="Hello", owner_id="u-1")
        video_id = await self.handlers.handle_create_video(cmd)
        saved = await self.repo.get_by_id(VideoId(uuid.UUID(video_id)))
        assert saved.title.value == "Hello"

    @pytest.mark.asyncio
    async def it_publishes_a_video_created_event(self) -> None:
        cmd = CreateVideoCommand(title="Hello", owner_id="u-1")
        await self.handlers.handle_create_video(cmd)
        assert len(self.publisher.published) == 1
        assert isinstance(self.publisher.published[0], VideoCreated)


class WhenHandlingCreateVideoWithInvalidTitle:
    def setup_method(self) -> None:
        self.repo = FakeVideoRepository()
        self.publisher = FakeEventPublisher()
        self.handlers = CatalogCommandHandlers(repo=self.repo, publisher=self.publisher)

    @pytest.mark.asyncio
    async def it_raises_a_domain_error(self) -> None:
        with pytest.raises(DomainError):
            await self.handlers.handle_create_video(CreateVideoCommand(title="", owner_id="u-1"))

    @pytest.mark.asyncio
    async def it_publishes_no_events(self) -> None:
        with pytest.raises(DomainError):
            await self.handlers.handle_create_video(CreateVideoCommand(title="", owner_id="u-1"))
        assert self.publisher.published == []
```

Do **not** use `mocker.patch` to replace port implementations — write a `Fake` class instead.
`pytest-mock` is only for infrastructure tests (stubbing `boto3.client`, `asyncio.to_thread`).

### HTTP acceptance tests — pytest-bdd + Gherkin

Feature files: `tests/features/{module}/{scenario}.feature`

```gherkin
# tests/features/catalog/create_video.feature
Feature: Create a video in the catalog
  As a content creator
  I want to add a video to my catalog

  Scenario: Successfully creating a video with valid data
    Given a content creator with owner ID "user-abc"
    When they submit a create video request with title "Introduction to Python"
    Then the response status is 201
    And the response contains a video ID

  Scenario: Rejecting a video with an empty title
    Given a content creator with owner ID "user-abc"
    When they submit a create video request with title ""
    Then the response status is 422
```

Step definitions alongside the feature file in `test_{scenario}.py`.

### Property-based tests with Hypothesis

Inside `When` classes — they integrate naturally:

```python
class WhenTitleIsWithinValidBounds:
    @given(value=st.text(min_size=1, max_size=200).filter(str.strip))
    @settings(max_examples=100)
    def it_never_raises(self, value: str) -> None:
        t = Title(value)
        assert 1 <= len(t.value) <= 200

class WhenTitleExceedsMaxLength:
    @given(value=st.text(min_size=201))
    @settings(max_examples=50)
    def it_always_raises_domain_error(self, value: str) -> None:
        with pytest.raises(DomainError):
            Title(value)
```

Good Hypothesis targets: value object boundaries, aggregate invariants, serialization round-trips.

---

## 6. Forbidden patterns

These are **correctness violations**, not style preferences.

| Forbidden | Why | Correct alternative |
|---|---|---|
| `from app.modules.streaming import ...` inside `catalog/` | Cross-module coupling | Use SNS events; define local mirror |
| `from motor.motor_asyncio import ...` in `domain/` or `application/` | Infrastructure leak | Define `IRepository` port in `domain/ports/` |
| `from fastapi import ...` in `domain/` or `application/` | Infrastructure leak | Use ports; call from `adapters/http/router.py` |
| `raise ValueError(...)` in domain layer | Leaks implementation | Use `DomainError` from `shared_kernel` |
| Returning a domain aggregate from a query handler | Leaks domain model | Return a `ReadModel` dataclass |
| Importing domain types in `adapters/http/schemas.py` | Couples HTTP to domain | Use Pydantic schemas; map manually in route handler |
| `settings = Settings()` at module level | Untestable singleton | Use `get_settings()` with `@lru_cache` |
| Motor calls without `asyncio.to_thread()` | Blocks event loop | `await asyncio.to_thread(collection.find_one, ...)` |
| Consumer tasks without `supervised_run()` | Silent failure on crash | Always use `supervised_run()` with restart loop |
| `mocker.patch` replacing a port in application tests | Masks interface contract | Write a `Fake` class that implements the port |
| Command handler that skips `pull_events()` | Events never published | Always `pull_events()` after `save()` |

---

## 7. File layout checklist

Before submitting any new file, verify:

- [ ] File is in the correct layer (domain / application / infrastructure / adapters)
- [ ] Imports respect the dependency direction table in section 1
- [ ] `domain/`: no third-party imports
- [ ] `application/`: no motor, boto3, FastAPI imports
- [ ] Aggregate method: `record_event()` is called on every state change
- [ ] Command handler: `pull_events()` + `publish()` called after `save()`
- [ ] Infrastructure adapter: extends the correct port ABC
- [ ] Domain event: extends `DomainEvent` and overrides `to_dict()`
- [ ] Corresponding test file exists
- [ ] Application tests use `Fake` port implementations, not mocks
