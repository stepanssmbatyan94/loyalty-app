---
description: Rules loaded when editing domain layer files
globs:
  - "app/modules/*/domain/**/*.py"
  - "app/shared_kernel/domain/**/*.py"
---

# Domain Layer Rules

You are editing the **domain layer** — the innermost ring. These rules are non-negotiable correctness constraints.

## Allowed imports ONLY

```python
from __future__ import annotations
# stdlib only: abc, dataclasses, uuid, datetime, typing, enum
from app.shared_kernel import ...   # shared kernel domain types only
from app.modules.{THIS_MODULE}.domain import ...  # same-module domain only
```

## Forbidden — these are bugs, not style issues

- `from motor.*` or `import boto3` or any third-party package → define a port in `domain/ports/` instead
- `from fastapi.*` → HTTP is infrastructure, not domain
- `from app.modules.{OTHER_MODULE}.*` → cross-module coupling; use SNS/SQS events
- `raise ValueError(...)` → always `raise DomainError("...")` from `shared_kernel`

## Patterns you must follow

**Aggregate Root:**
```python
@dataclass(eq=False)
class X(AggregateRoot[XId]):
    @classmethod
    def create(cls, ...) -> "X":
        x = cls(id=XId.generate(), ...)
        x.record_event(XCreated(...))   # ← mandatory
        return x

    def some_state_change(self) -> None:
        # validate invariant first
        if invalid_condition:
            raise DomainError("reason")
        # mutate
        self.field = new_value
        self.record_event(XStateChanged(...))  # ← mandatory
```

**Value Object:**
```python
@dataclass(frozen=True)
class MyValue(ValueObject):
    value: str
    def __post_init__(self) -> None:
        if not self.value:
            raise DomainError("value must not be empty")  # ← DomainError, not ValueError
```

**Domain Event:**
```python
@dataclass(frozen=True)
class XCreated(DomainEvent):   # ← past tense name
    x_id: str
    def to_dict(self) -> dict[str, object]:
        return {**super().to_dict(), "x_id": self.x_id}  # ← must override to_dict
```

**Port (outbound interface):**
```python
class IXRepository(ABC):      # ← I prefix, lives in domain/ports/
    @abstractmethod
    async def get_by_id(self, x_id: XId) -> X: ...
    @abstractmethod
    async def save(self, x: X) -> None: ...
```

## Quick checklist before saving

- [ ] No third-party imports
- [ ] Raises `DomainError`, never `ValueError`
- [ ] Every state-changing method calls `self.record_event(...)`
- [ ] New domain events override `to_dict()` and call `super().to_dict()`
- [ ] Port ABCs live in `domain/ports/`, not in `domain/` directly
