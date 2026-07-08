/**
 * File readers for JSON and Markdown files.
 *
 * - JSON reader: parse + validate against Zod schema
 * - Markdown reader: parse YAML front matter + body
 * - BOM stripping per §2.5.1
 *
 * @module
 */

import { readFile } from 'node:fs/promises';
import type { ZodType } from 'zod';
import { parseFrontMatter, type ParsedFrontMatter } from './frontmatter.js';
import { FileNotFoundError, ValidationError } from './errors.js';

/** Strip UTF-8 BOM if present (§2.5.1: JSON files MUST NOT include a BOM). */
function stripBom(content: string): string {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}

/**
 * Read a JSON file, parse it, and validate against a Zod schema.
 *
 * @throws FileNotFoundError if the file doesn't exist
 * @throws ValidationError if the data doesn't match the schema
 */
export async function readJson<T>(
  filePath: string,
  schema: ZodType<T>,
): Promise<T> {
  let raw: string;
  try {
    raw = await readFile(filePath, 'utf-8');
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === 'ENOENT') {
      throw new FileNotFoundError(filePath);
    }
    throw err;
  }

  raw = stripBom(raw);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new ValidationError(filePath, [
      {
        code: 'custom',
        path: [],
        message: 'Invalid JSON',
      },
    ]);
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new ValidationError(filePath, result.error.issues);
  }

  return result.data;
}

/**
 * Read a JSON file without schema validation.
 * Returns the raw parsed object.
 *
 * @throws FileNotFoundError if the file doesn't exist
 */
export async function readJsonRaw(filePath: string): Promise<unknown> {
  let raw: string;
  try {
    raw = await readFile(filePath, 'utf-8');
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === 'ENOENT') {
      throw new FileNotFoundError(filePath);
    }
    throw err;
  }

  raw = stripBom(raw);
  return JSON.parse(raw);
}

/**
 * Read a Markdown file and parse its YAML front matter.
 *
 * Optionally validates front matter against a Zod schema.
 *
 * @throws FileNotFoundError if the file doesn't exist
 * @throws ValidationError if front matter doesn't match the schema
 */
export async function readMarkdown<T = Record<string, unknown>>(
  filePath: string,
  frontMatterSchema?: ZodType<T>,
): Promise<ParsedFrontMatter<T>> {
  let raw: string;
  try {
    raw = await readFile(filePath, 'utf-8');
  } catch (err: unknown) {
    if (isNodeError(err) && err.code === 'ENOENT') {
      throw new FileNotFoundError(filePath);
    }
    throw err;
  }

  raw = stripBom(raw);
  const parsed = parseFrontMatter<T>(raw);

  if (frontMatterSchema && parsed.frontMatter !== null) {
    const result = frontMatterSchema.safeParse(parsed.frontMatter);
    if (!result.success) {
      throw new ValidationError(filePath, result.error.issues);
    }
    return { frontMatter: result.data, body: parsed.body };
  }

  return parsed;
}

/**
 * Check if a file exists (without throwing).
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await readFile(filePath);
    return true;
  } catch {
    return false;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && 'code' in err;
}
