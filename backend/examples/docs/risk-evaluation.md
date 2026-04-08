# Risk Evaluation — minolta-be

**Date:** 2026-03-13
**Scope:** FastAPI backend intended for AWS microservices with Postgres, SNS, SQS, ECR, and observability

---

## Summary

The foundation (FastAPI, pydantic-settings, pytest, uvicorn) is solid. The risks are concentrated in three areas: the Python async model, third-party AWS library choices, and database integration. One issue (CORS) is already broken in the current code.

---

## 1. Critical — will break things

### 1.1 CORS wildcard + credentials is a browser spec violation

**Location:** `app/main.py` — `CORSMiddleware`

`allow_origins=["*"]` combined with `allow_credentials=True` is illegal per the CORS specification. Browsers reject credentialed requests to wildcard origins silently — the frontend receives a generic network error, not a useful CORS message. This is already broken.

**Fix:**
```python
# Option A — specific origins (production)
allow_origins=settings.cors_origins,   # e.g. ["https://app.yourdomain.com"]
allow_credentials=True,

# Option B — truly public API (no cookies/auth headers)
allow_origins=["*"],
allow_credentials=False,
```

**Effort:** 2 lines. **Do this now.**

---

### 1.2 Sync route handlers block the entire server under load

FastAPI is async-first. A regular `def` handler blocks the event loop — every concurrent request waits behind it.

```python
# WRONG — blocks all users while the DB call is in flight
@router.get("/items/{id}")
def get_item(id: str):
    return collection.find_one({"_id": id})  # blocks!

# CORRECT
@router.get("/items/{id}")
async def get_item(id: str):
    return await collection.find_one({"_id": id})
```

This works fine with one user in development. It only breaks under real traffic. Python gives no warning.

**Rule:** every function that touches the network, database, or disk must be `async def`.

---

### 1.3 `aioboto3` is a single-maintainer third-party wrapper

`aioboto3` is not the official AWS SDK. It wraps `boto3` with async but is maintained by one person. Risks: release lag behind boto3, thin documentation, abandonment.

**Safer alternative — use official `boto3` via `asyncio.to_thread()`:**

```python
import asyncio
import boto3

_sns = boto3.client("sns", region_name=settings.aws_region)

async def publish(topic_arn: str, message: str) -> str:
    response = await asyncio.to_thread(
        _sns.publish, TopicArn=topic_arn, Message=message
    )
    return response["MessageId"]
```

This uses the fully supported, AWS-maintained SDK. The `asyncio.to_thread()` call runs the blocking boto3 call in a thread pool without blocking the event loop. AWS themselves recommend this pattern for Python async.

---

## 2. High — will cost significant time

### 2.1 SQS background consumer task dies silently

`asyncio.create_task()` swallows exceptions. If the consumer crashes, the task disappears, the queue backs up, and the service health endpoint still returns `"ok"`.

```python
# Bare task — silent failure
consumer_task = asyncio.create_task(sqs_consumer.run())

# Supervised task — restarts on failure, logs every crash
async def _supervised_consumer() -> None:
    while True:
        try:
            await sqs_consumer.run()
        except Exception:
            logger.exception("SQS consumer crashed — restarting in 5 s")
            await asyncio.sleep(5)

consumer_task = asyncio.create_task(_supervised_consumer())
```

Always add the supervisor wrapper before deploying any background worker.

---

### 2.2 Raw SQL migrations and repository code can drift

With raw SQL migrations and SQLAlchemy Core repositories, the main database risk is schema drift. If the SQL files and repository expectations diverge, the failure appears at runtime rather than compile time.

**Mitigation:** run migrations in CI and in local container-backed integration tests against the same Postgres major version used by development. Keep migration coverage and repository integration coverage mandatory for schema-affecting changes.

---

### 2.3 Pydantic v2 — most internet examples are v1

Pydantic v2 (installed) made major breaking changes from v1. Most Stack Overflow answers and blog posts are v1. They import without error but produce wrong results or hidden deprecation warnings.

| v1 (wrong — do not use) | v2 (correct) |
|------------------------|--------------|
| `model.dict()` | `model.model_dump()` |
| `model.json()` | `model.model_dump_json()` |
| `@validator("field")` | `@field_validator("field", mode="before")` |
| `@root_validator` | `@model_validator(mode="before")` |
| `from pydantic import validator` | `from pydantic import field_validator` |

**Check:** before copying any Pydantic code, look for `from pydantic import validator` — that is v1. Discard it.

---

### 2.4 Python 3.13 is too new for some production packages

The local environment uses Python 3.13.2. Some packages in the recommended stack do not yet have fully tested 3.13 support: `uvloop` (used by `uvicorn[standard]`), some OpenTelemetry instrumentation packages.

**Recommendation:** pin `python:3.12-slim` in the Dockerfile. Local 3.13 development is fine. Production containers should use 3.12 until the ecosystem fully catches up (approximately mid-2026).

---

## 3. Medium — will cost time but not catastrophic

### 3.1 `settings` singleton is not testable per-test

```python
settings = Settings()   # evaluated once at import time
```

Tests that need different config values (test DB URI vs production URI) cannot cleanly override this without `monkeypatch.setenv()` hacks, and only if called before the first import.

**Fix — use `lru_cache` and FastAPI dependency injection:**
```python
from functools import lru_cache

@lru_cache
def get_settings() -> Settings:
    return Settings()

# In tests:
app.dependency_overrides[get_settings] = lambda: Settings(db_name="test_db")
```

Make this change before writing tests that need config overrides.

---

### 3.2 OpenTelemetry instrumentation libraries are pre-release

`opentelemetry-instrumentation-fastapi` and related packages are versioned with a `b` suffix (e.g., `0.52b0`). These are beta packages with frequent breaking changes between minor versions.

**Mitigation:** pin exact versions (`==0.52b0`, not `~=0.52`) and upgrade deliberately, not as part of routine dependency updates.

---

### 3.3 Mixed log formats break CloudWatch Logs Insights

Adding `structlog` without bridging the standard `logging` module produces two log formats: JSON from application code, plain text from uvicorn, boto3, and SQLAlchemy/driver logs. CloudWatch cannot parse the mixed output.

**Required bridge:**
```python
import logging
import structlog

logging.basicConfig(
    format="%(message)s",
    handlers=[logging.StreamHandler()],
    level=logging.getLevelName(settings.log_level),
)
structlog.configure(
    ...,
    logger_factory=structlog.stdlib.LoggerFactory(),  # routes stdlib through structlog
)
```

---

## 4. Low risk — no action needed

| Item | Status |
|------|--------|
| FastAPI | Mature, actively maintained by Tiangolo, Starlette underneath is rock-solid |
| `pydantic-settings` | Correct tool for env-based config, stable |
| `sqlalchemy` + `asyncpg` | Standard async Postgres stack with broad ecosystem support |
| `pytest` + `hypothesis` | Both excellent, well-supported, no known issues |
| `uvicorn[standard]` | Production-grade, uvloop provides real throughput gains |
| `structlog` | Actively maintained, simple API, widely used in production |
| `prometheus-fastapi-instrumentator` | Straightforward, no known stability issues |

---

## 5. Risk register

| # | Risk | Severity | Fix effort |
|---|------|----------|-----------|
| 1.1 | CORS wildcard + credentials — already broken | Critical | 2 lines |
| 1.2 | Sync handlers block event loop under load | Critical | Ongoing discipline |
| 1.3 | `aioboto3` third-party abandonment risk | Critical | Replace with `boto3` + `asyncio.to_thread` |
| 2.1 | SQS consumer dies silently on crash | High | ~15-line supervisor wrapper |
| 2.2 | Schema drift between migrations and repositories | High | Run migration + repository integration tests in CI |
| 2.3 | Pydantic v2 — online examples are v1 | High | Awareness + verification before copy-paste |
| 2.4 | Python 3.13 ecosystem immaturity | High | Pin `python:3.12-slim` in Dockerfile |
| 3.1 | `settings` singleton breaks per-test config | Medium | `lru_cache` + dependency injection refactor |
| 3.2 | OTel instrumentation libraries are beta | Medium | Pin exact versions |
| 3.3 | Mixed log formats break CloudWatch parsing | Medium | Bridge stdlib → structlog |
