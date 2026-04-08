---
description: Rules loaded when editing application layer files
globs:
  - "app/modules/*/application/**/*.py"
---

# Application Layer Rules

You are editing the **application layer** — the orchestrator. It coordinates the domain but knows nothing about infrastructure or HTTP.

## Allowed imports ONLY

```python
from app.modules.{THIS_MODULE}.domain import ...       # own module domain
from app.modules.{THIS_MODULE}.domain.ports import ... # own module ports
from app.shared_kernel import ...                       # shared kernel
# stdlib: dataclasses, typing, etc.
```

## Forbidden — these are bugs

- `from motor.*` or `import boto3` → inject an `IRepository` port instead
- `from fastapi.*` → HTTP belongs in `adapters/http/`
- `from app.modules.{OTHER_MODULE}.domain.*` → cross-module coupling; communicate via events
- Synchronous handler methods (`def handle_...`) → always `async def`

## The canonical command handler pattern — never deviate

```python
class XCommandHandlers:
    def __init__(self, repo: IXRepository, publisher: IEventPublisher) -> None:
        self._repo = repo
        self._publisher = publisher

    async def handle_do_something(self, cmd: DoSomethingCommand) -> str:
        # 1. Load aggregate
        x = await self._repo.get_by_id(XId(cmd.x_id))
        # 2. Construct value objects (validation happens here)
        value = SomeValue(cmd.raw_value)
        # 3. Call domain method
        x.do_something(value)
        # 4. Persist — BEFORE pulling events
        await self._repo.save(x)
        # 5. Pull events and publish — AFTER save
        for event in x.pull_events():
            await self._publisher.publish(event)
        return str(x.id.value)
```

Why this order matters:
- If `save()` fails → no events published → consistent state
- If `publish()` fails → state is already durable → retry is safe

## Command dataclasses

```python
@dataclass(frozen=True)      # ← frozen always
class DoSomethingCommand:
    x_id: str
    raw_value: str            # ← primitive types only, no domain types
```

## Query handlers

```python
async def handle_get_x(self, q: GetXQuery) -> XReadModel:
    # Never returns a domain aggregate — always a ReadModel dataclass
    # Never mutates state
    # Never calls record_event or pull_events
    ...
```

## Quick checklist before saving

- [ ] Handler is `async def`
- [ ] Handler imports only domain ports, not concrete infrastructure
- [ ] `pull_events()` called **after** `save()`
- [ ] Commands are `@dataclass(frozen=True)` with primitive field types
- [ ] Query handlers return a `ReadModel`, never a domain aggregate
- [ ] No motor, boto3, or FastAPI imports
