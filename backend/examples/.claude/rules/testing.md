---
description: Rules loaded when editing test files
globs:
  - "tests/**/*.py"
---

# Testing Rules — BDD Style

Tests are living behavior specifications. Each test describes one scenario: in what context,
under what action, with what outcome. Not how the code works internally.

---

## Test structure: When / It

Use `When{Context}` classes with `it_{outcome}` methods. Pytest collects them automatically.

```python
# tests/modules/catalog/domain/test_video.py

class WhenCreatingAVideo:
    def it_assigns_a_unique_id(self) -> None:
        video = Video.create(title=Title("My Video"), owner_id="user-123")
        assert video.id is not None

    def it_records_a_video_created_event(self) -> None:
        video = Video.create(title=Title("My Video"), owner_id="user-123")
        events = video.pull_events()
        assert len(events) == 1
        assert isinstance(events[0], VideoCreated)
        assert events[0].title == "My Video"


class WhenPublishingADraftVideo:
    def it_changes_status_to_published(self) -> None:
        # Given
        video = Video.create(title=Title("My Video"), owner_id="user-123")
        video.pull_events()
        # When
        video.publish()
        # Then
        assert video.status == VideoStatus.PUBLISHED

    def it_records_a_video_published_event(self) -> None:
        video = Video.create(title=Title("My Video"), owner_id="user-123")
        video.pull_events()
        video.publish()
        events = video.pull_events()
        assert len(events) == 1
        assert isinstance(events[0], VideoPublished)


class WhenPublishingANonDraftVideo:
    def it_raises_a_domain_error(self) -> None:
        # Given — already published
        video = Video.create(title=Title("My Video"), owner_id="user-123")
        video.publish()
        video.pull_events()
        # When / Then
        with pytest.raises(DomainError, match="only draft"):
            video.publish()

    def it_records_no_event(self) -> None:
        video = Video.create(title=Title("My Video"), owner_id="user-123")
        video.publish()
        video.pull_events()
        with pytest.raises(DomainError):
            video.publish()
        assert video.pull_events() == []
```

Pytest output reads as behavior documentation:
```
PASSED WhenPublishingADraftVideo::it_changes_status_to_published
PASSED WhenPublishingANonDraftVideo::it_raises_a_domain_error
```

**Naming rules:**
- Class: `When{PascalCaseCondition}` — the scenario under test
- Method: `it_{natural_language_outcome}` — the expected outcome (no `test_` prefix)
- One behavior per method — never combine multiple Given/When/Then cycles in one test

---

## Test type → location → pattern

| Layer | Location | Pattern |
|---|---|---|
| Domain unit | `tests/modules/X/domain/` | `When/It` classes, no mocks, pure Python |
| Application unit | `tests/modules/X/application/` | `When/It` classes + Fake port implementations |
| Infrastructure | `tests/modules/X/infrastructure/` | `mongomock-motor`, LocalStack stubs |
| HTTP acceptance | `tests/features/{module}/` | `pytest-bdd` + Gherkin `.feature` files |
| Property-based | Inside `When` classes in domain tests | Hypothesis `@given` |

**Key principle:** `pytest tests/modules/X/domain/` must pass with zero external services.

---

## Application tests: Fake ports + When/It

Fakes are defined at the top of the test file. They implement the port ABC — they are not mocks.

```python
class FakeVideoRepository(IVideoRepository):
    def __init__(self) -> None:
        self._store: dict[str, Video] = {}

    async def get_by_id(self, video_id: VideoId) -> Video:
        try:
            return self._store[str(video_id.value)]
        except KeyError:
            raise NotFoundError(f"Video {video_id.value} not found")

    async def save(self, video: Video) -> None:
        self._store[str(video.id.value)] = video

    async def delete(self, video_id: VideoId) -> None:
        self._store.pop(str(video_id.value), None)

    async def find_all(self, limit: int = 20, offset: int = 0) -> list[Video]:
        items = list(self._store.values())
        return items[offset : offset + limit]


class FakeEventPublisher(IEventPublisher):
    def __init__(self) -> None:
        self.published: list[DomainEvent] = []

    async def publish(self, event: DomainEvent) -> None:
        self.published.append(event)
```

Each `When` class gets its own `setup_method` for test isolation:

```python
class WhenHandlingCreateVideoWithValidData:
    def setup_method(self) -> None:
        self.repo = FakeVideoRepository()
        self.publisher = FakeEventPublisher()
        self.handlers = CatalogCommandHandlers(repo=self.repo, publisher=self.publisher)

    @pytest.mark.asyncio
    async def it_returns_a_video_id(self) -> None:
        cmd = CreateVideoCommand(title="Hello World", owner_id="u-1")
        video_id = await self.handlers.handle_create_video(cmd)
        assert video_id is not None

    @pytest.mark.asyncio
    async def it_persists_the_new_video(self) -> None:
        cmd = CreateVideoCommand(title="Hello World", owner_id="u-1")
        video_id = await self.handlers.handle_create_video(cmd)
        saved = await self.repo.get_by_id(VideoId(uuid.UUID(video_id)))
        assert saved.title.value == "Hello World"

    @pytest.mark.asyncio
    async def it_publishes_a_video_created_event(self) -> None:
        cmd = CreateVideoCommand(title="Hello World", owner_id="u-1")
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
        cmd = CreateVideoCommand(title="", owner_id="u-1")
        with pytest.raises(DomainError):
            await self.handlers.handle_create_video(cmd)

    @pytest.mark.asyncio
    async def it_publishes_no_events(self) -> None:
        cmd = CreateVideoCommand(title="", owner_id="u-1")
        with pytest.raises(DomainError):
            await self.handlers.handle_create_video(cmd)
        assert self.publisher.published == []
```

Why `Fake` over `mocker.patch`:
- Fakes exercise the real port contract — mocks bypass it
- Type checker catches if the port ABC gains a new method
- Tests are readable without mock-wiring boilerplate

`pytest-mock` is **only** for infrastructure tests where you must stub `boto3.client` or `asyncio.to_thread`.

---

## Given/When/Then body structure

For non-trivial tests, add explicit section comments:

```python
def it_changes_status_to_published(self) -> None:
    # Given — a draft video exists in the catalog
    video = Video.create(title=Title("Tutorial"), owner_id="owner-1")
    video.pull_events()  # flush creation event

    # When — the owner publishes it
    video.publish()

    # Then — status is published and the event is recorded
    assert video.status == VideoStatus.PUBLISHED
    events = video.pull_events()
    assert any(isinstance(e, VideoPublished) for e in events)
```

One scenario per test. Never combine two "When" actions in one test method.

---

## HTTP acceptance tests: pytest-bdd + Gherkin

Feature files live in `tests/features/{module}/`. Step definitions live alongside them.

```gherkin
# tests/features/catalog/create_video.feature
Feature: Create a video in the catalog
  As a content creator
  I want to add a video to my catalog
  So that viewers can discover and watch it

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

```python
# tests/features/catalog/test_create_video.py
from pytest_bdd import scenarios, given, when, then, parsers

scenarios("create_video.feature")

@given(parsers.parse('a content creator with owner ID "{owner_id}"'), target_fixture="owner_id")
def content_creator(owner_id: str) -> str:
    return owner_id

@when(
    parsers.parse('they submit a create video request with title "{title}"'),
    target_fixture="response",
)
def submit_create_video(client, owner_id, title):
    return client.post("/api/v1/catalog/videos", json={"title": title, "owner_id": owner_id})

@then(parsers.parse("the response status is {status:d}"))
def check_status(response, status: int) -> None:
    assert response.status_code == status

@then("the response contains a video ID")
def check_video_id(response) -> None:
    assert "id" in response.json()
    assert response.json()["id"]
```

---

## Property-based tests with Hypothesis

Place inside `When` classes — they integrate naturally:

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

Good Hypothesis targets: value object boundary conditions, aggregate invariants, serialization round-trips.

---

## What to cover for every aggregate method

1. Happy path — state mutation applied correctly
2. Correct domain event recorded (right type + right fields)
3. `pull_events()` clears the queue after draining
4. Every guard condition — `DomainError` raised, state unchanged, no event queued

---

## Quick checklist before saving

- [ ] Test classes use `When{Context}` / methods use `it_{outcome}` (not `TestXxx` / `test_xxx`)
- [ ] Domain tests: no mocks, no DB, no `.env` dependency
- [ ] Application tests: `Fake` classes implementing the port ABC — no `mocker.patch` on ports
- [ ] Async tests decorated with `@pytest.mark.asyncio`
- [ ] Non-trivial test bodies have `# Given`, `# When`, `# Then` comment sections
- [ ] Each aggregate method has at least one error-path scenario in a `WhenX` class
- [ ] New value objects have Hypothesis boundary tests
- [ ] Each `When` class tests exactly one scenario context (one shared setup in `setup_method`)
- [ ] HTTP acceptance scenarios use pytest-bdd feature files in `tests/features/{module}/`
