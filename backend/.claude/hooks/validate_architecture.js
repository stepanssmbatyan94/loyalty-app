#!/usr/bin/env node
/**
 * PreToolUse hook: enforce Hexagonal Architecture boundaries.
 *
 * Intercepts Write and Edit tool calls on TypeScript files inside src/ and
 * blocks any content that would introduce a forbidden import pattern as
 * defined in docs/architecture.md and docs/conventions.md.
 *
 * Exit codes:
 *   0 — allow (no violation found)
 *   2 — block (violation found; message printed to stdout for Claude to read)
 */

'use strict';

const path = require('path');

// ── Forbidden import patterns per layer ──────────────────────────────────────

// These packages must never appear in domain/ files.
const DOMAIN_FORBIDDEN_IMPORTS = [
  'typeorm',
  'mongoose',
  '@nestjs/typeorm',
  '@nestjs/mongoose',
  'sequelize',
];

// These TypeORM/Mongoose decorators must never appear in domain/ files.
const DOMAIN_FORBIDDEN_DECORATOR_RE =
  /@(Entity|Column|PrimaryGeneratedColumn|PrimaryColumn|ManyToOne|OneToMany|OneToOne|ManyToMany|JoinColumn|JoinTable|Schema|Prop|InjectRepository|InjectModel)\b/;

// Direct DB injection must never appear in service files.
const SERVICE_FORBIDDEN_IMPORTS = [
  'typeorm',
  'mongoose',
  '@nestjs/typeorm',
  '@nestjs/mongoose',
];

const SERVICE_FORBIDDEN_INJECT_RE = /@InjectRepository\b|@InjectModel\b/;

// Services and controllers must never import from infrastructure adapters directly.
const INFRA_ADAPTER_IMPORT_RE =
  /from\s+['"].*\/infrastructure\/persistence\/(relational|document)\//;

// ── Layer classification ──────────────────────────────────────────────────────

/**
 * Returns the layer name if the file is subject to rules, otherwise null.
 * Layers: "domain", "service", "controller"
 */
function classifyFile(filePath) {
  const normalized = filePath.replace(/\\/g, '/');

  if (!normalized.includes('/src/')) return null;
  if (!normalized.endsWith('.ts') || normalized.endsWith('.spec.ts')) return null;

  // Domain layer: src/*/domain/**
  if (/\/src\/[^/]+\/domain\//.test(normalized)) return 'domain';

  // Service layer: src/*.service.ts
  if (/\/src\/[^/]+\/[^/]+\.service\.ts$/.test(normalized)) return 'service';

  // Controller layer: src/*.controller.ts
  if (/\/src\/[^/]+\/[^/]+\.controller\.ts$/.test(normalized)) return 'controller';

  return null;
}

// ── Violation checkers ────────────────────────────────────────────────────────

function checkDomainViolations(content, filePath) {
  const violations = [];

  for (const pkg of DOMAIN_FORBIDDEN_IMPORTS) {
    const re = new RegExp(`from\\s+['"]${escapeRegExp(pkg)}['"]|require\\(['"]${escapeRegExp(pkg)}['"]\\)`, 'm');
    if (re.test(content)) {
      violations.push(
        `Infrastructure import '${pkg}' in domain layer. ` +
          `Domain entities must be plain TypeScript classes with no DB dependencies. ` +
          `Define a repository port (abstract class) in infrastructure/persistence/ instead ` +
          `(docs/architecture.md — Hexagonal Architecture).`,
      );
    }
  }

  if (DOMAIN_FORBIDDEN_DECORATOR_RE.test(content)) {
    violations.push(
      `Database decorator (TypeORM/Mongoose) found in domain layer. ` +
        `Domain files may only use @ApiProperty (Swagger) and class-transformer decorators ` +
        `(@Expose, @Exclude). Move DB decorators to infrastructure/persistence/relational/entities/ ` +
        `or infrastructure/persistence/document/entities/.`,
    );
  }

  if (INFRA_ADAPTER_IMPORT_RE.test(content)) {
    violations.push(
      `Direct import from infrastructure/persistence adapter in domain layer. ` +
        `Domain code must never depend on concrete infrastructure. ` +
        `Inject the abstract repository port (XRepository) instead.`,
    );
  }

  return violations;
}

function checkServiceViolations(content, filePath) {
  const violations = [];

  for (const pkg of SERVICE_FORBIDDEN_IMPORTS) {
    const re = new RegExp(`from\\s+['"]${escapeRegExp(pkg)}['"]|require\\(['"]${escapeRegExp(pkg)}['"]\\)`, 'm');
    if (re.test(content)) {
      violations.push(
        `Direct import of '${pkg}' in service layer. ` +
          `Services must depend on the abstract repository port (e.g. UserRepository), not on ` +
          `TypeORM/Mongoose internals. The concrete adapter is injected by the NestJS module ` +
          `(docs/conventions.md §4).`,
      );
    }
  }

  if (SERVICE_FORBIDDEN_INJECT_RE.test(content)) {
    violations.push(
      `@InjectRepository or @InjectModel decorator found in service. ` +
        `Services must inject the abstract port class directly — ` +
        `NestJS resolves it to the concrete adapter via the persistence module. ` +
        `Use: constructor(private readonly xRepository: XRepository) ` +
        `(see src/users/users.service.ts as reference).`,
    );
  }

  if (INFRA_ADAPTER_IMPORT_RE.test(content)) {
    violations.push(
      `Direct import from infrastructure/persistence adapter in service. ` +
        `Import the abstract port from infrastructure/persistence/x.repository.ts instead.`,
    );
  }

  return violations;
}

function checkControllerViolations(content, filePath) {
  const violations = [];

  if (INFRA_ADAPTER_IMPORT_RE.test(content)) {
    violations.push(
      `Direct import from infrastructure/persistence adapter in controller. ` +
        `Controllers must only call service methods — never interact with repositories directly.`,
    );
  }

  for (const pkg of SERVICE_FORBIDDEN_IMPORTS) {
    const re = new RegExp(`from\\s+['"]${escapeRegExp(pkg)}['"]`, 'm');
    if (re.test(content)) {
      violations.push(
        `Infrastructure package '${pkg}' imported in controller. ` +
          `Controllers are HTTP adapters only: HTTP → Service → Repository. ` +
          `Move DB logic to the service layer.`,
      );
    }
  }

  return violations;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  let raw = '';
  try {
    const stdin = require('fs').readFileSync('/dev/stdin', 'utf8');
    raw = stdin;
  } catch {
    process.exit(0);
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const toolName = data.tool_name || '';
  const toolInput = data.tool_input || {};

  let filePath = '';
  let content = '';

  if (toolName === 'Write') {
    filePath = toolInput.file_path || '';
    content = toolInput.content || '';
  } else if (toolName === 'Edit') {
    filePath = toolInput.file_path || '';
    // Only validate what is being added — the new string.
    content = toolInput.new_string || '';
  } else {
    process.exit(0);
  }

  const layer = classifyFile(filePath);
  if (!layer) process.exit(0);

  let violations = [];

  if (layer === 'domain') {
    violations = checkDomainViolations(content, filePath);
  } else if (layer === 'service') {
    violations = checkServiceViolations(content, filePath);
  } else if (layer === 'controller') {
    violations = checkControllerViolations(content, filePath);
  }

  if (violations.length === 0) process.exit(0);

  const msg =
    `ARCHITECTURE VIOLATION — ${filePath}\n` +
    violations.map((v) => `  ✗ ${v}`).join('\n') +
    '\n\nFix the violation before writing this file. ' +
    'See docs/architecture.md and docs/conventions.md §4.';

  process.stdout.write(msg + '\n');
  process.exit(2);
}

main();
