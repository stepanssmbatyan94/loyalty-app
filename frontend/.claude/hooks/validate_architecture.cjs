#!/usr/bin/env node
/**
 * PreToolUse hook: enforce Feature-Based Architecture boundaries.
 *
 * Intercepts Write and Edit tool calls on TypeScript/TSX files inside src/
 * and blocks any content that would introduce a forbidden import pattern as
 * defined in docs/project-structure.md and .claude/skills/next-loyalty-app/SKILL.md.
 *
 * Exit codes:
 *   0 — allow (no violation found)
 *   2 — block (violation found; message printed to stdout for Claude to read)
 *
 * NOTE: This file uses .cjs extension because the frontend package.json has
 * "type": "module", which would make .js files run as ES modules (no require).
 */

'use strict';

// ── Layer classification ──────────────────────────────────────────────────────

/**
 * Classifies a file path into an architecture layer.
 * Returns null for files that are not subject to validation.
 */
function classifyFile(filePath) {
  const n = filePath.replace(/\\/g, '/');

  if (!n.includes('/src/')) return null;
  if (!n.match(/\.(ts|tsx)$/)) return null;
  if (n.endsWith('.d.ts')) return null;
  // Skip test files — they have their own rules
  if (n.endsWith('.test.ts') || n.endsWith('.test.tsx') || n.endsWith('.spec.ts') || n.endsWith('.spec.tsx')) return null;
  // Skip story files
  if (n.endsWith('.stories.tsx') || n.endsWith('.stories.ts')) return null;

  // Feature API layer: src/features/{name}/api/**
  if (/\/src\/features\/[^/]+\/api\//.test(n)) {
    return { layer: 'feature-api', filePath: n };
  }

  // Feature layer: src/features/{name}/**
  if (/\/src\/features\//.test(n)) {
    const m = n.match(/\/src\/features\/([^/]+)\//);
    return { layer: 'feature', featureName: m ? m[1] : null, filePath: n };
  }

  // Shared components layer: src/components/**
  if (/\/src\/components\//.test(n)) {
    return { layer: 'shared-component', filePath: n };
  }

  // Library layer: src/lib/**
  if (/\/src\/lib\//.test(n)) {
    return { layer: 'lib', filePath: n };
  }

  return null;
}

// ── Violation checkers ────────────────────────────────────────────────────────

/**
 * Feature layer: no cross-feature imports, 'use client' must be on line 1.
 */
function checkFeatureViolations(content, info) {
  const violations = [];
  const { featureName } = info;

  if (featureName) {
    // Check for imports from other features
    const importMatches = [...content.matchAll(/from\s+['"]@\/features\/([^/'"]+)/g)];
    for (const m of importMatches) {
      if (m[1] !== featureName) {
        violations.push(
          `Cross-feature import detected: importing from '@/features/${m[1]}' inside feature '${featureName}'. ` +
            `Features must be self-contained. ` +
            `If you need to compose data across features, do it at the app layer (src/app/**). ` +
            `If the import is truly shared, extract it to src/lib/, src/hooks/, src/types/, or src/components/. ` +
            `(docs/project-structure.md — unidirectional codebase architecture)`,
        );
      }
    }
  }

  // Check 'use client' placement in TSX files
  violations.push(...checkUseClientPlacement(content, info.filePath));

  return violations;
}

/**
 * Feature API layer: raw fetch() is forbidden unless the file uses RTK Query (legacy).
 */
function checkFeatureApiViolations(content) {
  const violations = [];

  // RTK Query files are exempt (legacy pattern for gypsum-products / auth)
  if (/from\s+['"]@reduxjs\/toolkit\/query/.test(content)) return violations;
  if (/fetchBaseQuery/.test(content)) return violations;

  // Block raw fetch() calls — must use api from @/lib/api-client
  if (/(?<!\w)fetch\s*\(/.test(content) && !/from\s+['"]@\/lib\/api-client['"]/.test(content)) {
    violations.push(
      `Raw fetch() call detected in a feature API file. ` +
        `All API calls must go through the shared client: import { api } from '@/lib/api-client'. ` +
        `Example: export const getItems = (): Promise<Item[]> => api.get('/items'); ` +
        `(.claude/skills/next-loyalty-app/SKILL.md §3 — API layer pattern)`,
    );
  }

  return violations;
}

/**
 * Shared component layer: no imports from src/features/, 'use client' must be on line 1.
 */
function checkSharedComponentViolations(content, info) {
  const violations = [];

  if (/from\s+['"]@\/features\//.test(content)) {
    violations.push(
      `Shared component imports from a feature module. ` +
        `src/components/ must not depend on src/features/ — shared components are domain-agnostic. ` +
        `Move the component into the relevant feature, or extract the shared logic to src/lib/ or src/hooks/. ` +
        `(docs/project-structure.md — unidirectional codebase architecture)`,
    );
  }

  violations.push(...checkUseClientPlacement(content, info.filePath));

  return violations;
}

/**
 * Library layer: no imports from src/features/.
 */
function checkLibViolations(content) {
  const violations = [];

  if (/from\s+['"]@\/features\//.test(content)) {
    violations.push(
      `Library file imports from a feature module. ` +
        `src/lib/ is a foundation layer and must not depend on src/features/. ` +
        `If this logic needs feature data, pass it as a parameter instead of importing it. ` +
        `(docs/project-structure.md — unidirectional codebase architecture)`,
    );
  }

  return violations;
}

/**
 * 'use client' directive must appear on line 1 (or line 2 at most, after a comment).
 * Applies to .tsx files only.
 */
function checkUseClientPlacement(content, filePath) {
  if (!filePath.endsWith('.tsx')) return [];
  if (!content.includes('use client')) return [];

  const lines = content.split('\n');
  const directiveIndex = lines.findIndex((l) => /['"]use client['"]/.test(l));

  if (directiveIndex > 2) {
    return [
      `'use client' directive found at line ${directiveIndex + 1} but must be the first line of the file. ` +
        `Next.js App Router requires the directive at the very top. ` +
        `Move it to line 1, before any imports.`,
    ];
  }

  return [];
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  let raw = '';
  try {
    raw = require('fs').readFileSync('/dev/stdin', 'utf8');
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
    // Validate only what is being added — the new string
    content = toolInput.new_string || '';
  } else {
    process.exit(0);
  }

  const info = classifyFile(filePath);
  if (!info) process.exit(0);

  let violations = [];

  switch (info.layer) {
    case 'feature':
      violations = checkFeatureViolations(content, info);
      break;
    case 'feature-api':
      violations = checkFeatureApiViolations(content, info);
      break;
    case 'shared-component':
      violations = checkSharedComponentViolations(content, info);
      break;
    case 'lib':
      violations = checkLibViolations(content, info);
      break;
    default:
      process.exit(0);
  }

  if (violations.length === 0) process.exit(0);

  const msg =
    `ARCHITECTURE VIOLATION — ${filePath}\n` +
    violations.map((v) => `  x ${v}`).join('\n') +
    '\n\nFix the violation before writing this file. ' +
    'See docs/project-structure.md and .claude/skills/next-loyalty-app/SKILL.md.';

  process.stdout.write(msg + '\n');
  process.exit(2);
}

main();
