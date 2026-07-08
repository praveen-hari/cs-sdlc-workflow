/**
 * Generate JSON Schema files from Zod schemas.
 *
 * Usage: tsx scripts/generate-schemas.ts
 * Output: schemas/*.schema.json
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { zodToJsonSchema } from 'zod-to-json-schema';

import { manifestSchema } from '../src/schemas/manifest.js';
import { workIndexSchema, decisionsIndexSchema, releasesIndexSchema } from '../src/schemas/indexes.js';
import {
  architectureFrontMatterSchema, conventionsFrontMatterSchema,
  requirementsFrontMatterSchema, briefFrontMatterSchema,
  planFrontMatterSchema, decisionFrontMatterSchema,
  releaseFrontMatterSchema,
} from '../src/schemas/objects.js';
import { latestSnapshotSchema, historySnapshotSchema } from '../src/schemas/snapshots.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, '..', 'schemas');

const schemas = [
  { name: 'manifest', schema: manifestSchema, id: 'https://cs-sdlc.dev/schema/v1/manifest.json' },
  { name: 'work-index', schema: workIndexSchema, id: 'https://cs-sdlc.dev/schema/v1/work-index.json' },
  { name: 'decisions-index', schema: decisionsIndexSchema, id: 'https://cs-sdlc.dev/schema/v1/decisions-index.json' },
  { name: 'releases-index', schema: releasesIndexSchema, id: 'https://cs-sdlc.dev/schema/v1/releases-index.json' },
  { name: 'latest-snapshot', schema: latestSnapshotSchema, id: 'https://cs-sdlc.dev/schema/v1/latest-snapshot.json' },
  { name: 'history-snapshot', schema: historySnapshotSchema, id: 'https://cs-sdlc.dev/schema/v1/history-snapshot.json' },
  { name: 'architecture-frontmatter', schema: architectureFrontMatterSchema, id: 'https://cs-sdlc.dev/schema/v1/architecture-frontmatter.json' },
  { name: 'conventions-frontmatter', schema: conventionsFrontMatterSchema, id: 'https://cs-sdlc.dev/schema/v1/conventions-frontmatter.json' },
  { name: 'requirements-frontmatter', schema: requirementsFrontMatterSchema, id: 'https://cs-sdlc.dev/schema/v1/requirements-frontmatter.json' },
  { name: 'brief-frontmatter', schema: briefFrontMatterSchema, id: 'https://cs-sdlc.dev/schema/v1/brief-frontmatter.json' },
  { name: 'plan-frontmatter', schema: planFrontMatterSchema, id: 'https://cs-sdlc.dev/schema/v1/plan-frontmatter.json' },
  { name: 'decision-frontmatter', schema: decisionFrontMatterSchema, id: 'https://cs-sdlc.dev/schema/v1/decision-frontmatter.json' },
  { name: 'release-frontmatter', schema: releaseFrontMatterSchema, id: 'https://cs-sdlc.dev/schema/v1/release-frontmatter.json' },
];

mkdirSync(outDir, { recursive: true });

let count = 0;
for (const { name, schema, id } of schemas) {
  const jsonSchema = zodToJsonSchema(schema, {
    name,
    $refStrategy: 'none',
  });

  // Add $id
  const output = { $id: id, ...jsonSchema };

  const filePath = join(outDir, `${name}.schema.json`);
  writeFileSync(filePath, JSON.stringify(output, null, 2) + '\n');
  count++;
  console.log(`  ✓ ${name}.schema.json`);
}

console.log(`\nGenerated ${count} JSON Schema files in schemas/`);
