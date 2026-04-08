# minolta-be

Hexagonal DDD video platform backend. Python 3.13 + FastAPI 0.115.

## Commands

```bash
make dev          # hot-reload server on :8100
make test         # full test suite
make lint         # ruff linter
make check-arch   # verify import boundaries (import-linter)
make install-dev  # install all dependencies
```

## Architecture — read before touching any module code

@docs/architecture.md

## Conventions — checklist for adding features

@docs/conventions.md

## Scoped rules (auto-loaded by layer)

More focused rules are loaded automatically based on which files you edit:

| What you're editing | Rule file loaded |
|---|---|
| `app/modules/*/domain/**` | `.claude/rules/domain-layer.md` |
| `app/modules/*/application/**` | `.claude/rules/application-layer.md` |
| `tests/**` | `.claude/rules/testing.md` |

## Architectural enforcement

Two layers of enforcement run automatically:

**1. Claude Code hook (real-time):** `.claude/hooks/validate_architecture.py`
Intercepts every Write/Edit on Python files in `app/modules/` and blocks forbidden import patterns before they are written to disk.

**2. import-linter (CI):** `.importlinter`
Defines 5 machine-checkable contracts (bounded-context independence, domain purity, application purity, shared-kernel purity, adapter isolation). Run with `make check-arch`.

## Settings

Always use `get_settings()` (lru_cache function in `app/core/config.py`). Never `settings = Settings()` at module level.

## Project skill

`.claude/skills/minolta-python/SKILL.md` — detailed patterns, examples, and the full forbidden-patterns table for clean Python/DDD code in this codebase.
