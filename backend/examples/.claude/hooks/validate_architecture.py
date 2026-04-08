#!/usr/bin/env python3
"""
PreToolUse hook: enforce hexagonal DDD architectural boundaries.

Intercepts Write and Edit tool calls on Python files inside app/modules/
and blocks any content that would introduce a forbidden import pattern
as defined in docs/architecture.md §5 and docs/conventions.md §4.

Exit codes:
  0 — allow (no violation found)
  2 — block (violation found; message printed to stdout for Claude to read)
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

# ── Forbidden patterns per layer ──────────────────────────────────────────────

MODULES = {"catalog", "streaming", "ingest", "identity"}

# Third-party packages that must never appear in domain or application layers.
INFRA_PACKAGES = [
    "motor",
    "boto3",
    "botocore",
    "pymongo",
    "aiobotocore",
    "AsyncIOMotorClient",
    "AsyncIOMotorDatabase",
]

# FastAPI is only allowed in adapters/http/ — never in domain or application.
FASTAPI_IMPORT_RE = re.compile(r"^\s*(?:from fastapi|import fastapi)\b", re.MULTILINE)

INFRA_IMPORT_RE = re.compile(
    r"^\s*(?:from|import)\s+(" + "|".join(re.escape(p) for p in INFRA_PACKAGES) + r")\b",
    re.MULTILINE,
)


def classify_file(path: Path) -> tuple[str, str] | None:
    """
    Return (layer, module_name) if the file lives in a known module layer,
    otherwise return None (file is not subject to these rules).

    Layer values: "domain", "application"
    """
    try:
        parts = path.parts
        if "modules" not in parts:
            return None
        mi = parts.index("modules")
        if len(parts) <= mi + 2:
            return None
        module = parts[mi + 1]
        if module not in MODULES:
            return None
        remaining = parts[mi + 2:]
        if remaining[0] == "domain":
            return ("domain", module)
        if remaining[0] == "application":
            return ("application", module)
        return None
    except (ValueError, IndexError):
        return None


def check_violations(content: str, layer: str, module: str, file_path: str) -> list[str]:
    violations: list[str] = []

    # Rule: no cross-module imports anywhere in domain or application layers.
    for other in MODULES:
        if other == module:
            continue
        pattern = re.compile(
            rf"^\s*(?:from|import)\s+app\.modules\.{re.escape(other)}\b",
            re.MULTILINE,
        )
        if pattern.search(content):
            violations.append(
                f"Cross-module import: '{layer}/{module}' must never import from "
                f"'app.modules.{other}'. Modules communicate via SNS/SQS events only "
                f"(docs/architecture.md §11)."
            )

    if layer == "domain":
        # No third-party infrastructure packages.
        m = INFRA_IMPORT_RE.search(content)
        if m:
            violations.append(
                f"Infrastructure import in domain layer: '{m.group(1)}' must not appear "
                f"in domain/. Define a port (ABC) in domain/ports/ instead "
                f"(docs/architecture.md §5)."
            )
        # No FastAPI.
        if FASTAPI_IMPORT_RE.search(content):
            violations.append(
                "FastAPI import in domain layer: FastAPI is an infrastructure concern. "
                "Domain code must have no knowledge of HTTP "
                "(docs/conventions.md §4)."
            )

    elif layer == "application":
        # No infrastructure packages (motor, boto3, etc.).
        m = INFRA_IMPORT_RE.search(content)
        if m:
            violations.append(
                f"Infrastructure import in application layer: '{m.group(1)}' must not "
                f"appear in application/. Inject an IRepository port instead "
                f"(docs/architecture.md §5, docs/conventions.md §4)."
            )
        # No FastAPI.
        if FASTAPI_IMPORT_RE.search(content):
            violations.append(
                "FastAPI import in application layer: HTTP concerns belong in "
                "adapters/http/ only (docs/conventions.md §4)."
            )
        # No cross-module domain/application imports (already caught above for
        # any modules/ import, but add a clearer message for the __init__ case).
        for other in MODULES:
            if other == module:
                continue
            pattern = re.compile(
                rf"^\s*(?:from|import)\s+app\.modules\.{re.escape(other)}"
                rf"\.(?:domain|application)\b",
                re.MULTILINE,
            )
            if pattern.search(content):
                violations.append(
                    f"Cross-module internal import: application layer of '{module}' "
                    f"must not import from '{other}.domain' or '{other}.application'. "
                    f"Use the public __init__.py surface or SNS/SQS events only."
                )

    return violations


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, OSError):
        sys.exit(0)

    tool_name: str = data.get("tool_name", "")
    tool_input: dict = data.get("tool_input", {})

    if tool_name == "Write":
        file_path = tool_input.get("file_path", "")
        content = tool_input.get("content", "")
    elif tool_name == "Edit":
        file_path = tool_input.get("file_path", "")
        # Check the replacement content; old content is the responsibility of
        # earlier writes — we only validate what is being added.
        content = tool_input.get("new_string", "")
    else:
        sys.exit(0)

    if not file_path.endswith(".py"):
        sys.exit(0)

    classification = classify_file(Path(file_path))
    if classification is None:
        sys.exit(0)

    layer, module = classification
    violations = check_violations(content, layer, module, file_path)

    if not violations:
        sys.exit(0)

    print(
        f"ARCHITECTURE VIOLATION — {file_path}\n"
        + "\n".join(f"  ✗ {v}" for v in violations)
        + "\n\nFix the violation before writing this file. "
        + "See docs/architecture.md §5 and docs/conventions.md §4."
    )
    sys.exit(2)


if __name__ == "__main__":
    main()
