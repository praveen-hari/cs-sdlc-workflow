/**
 * YAML front matter parser and serializer per §5.2.
 *
 * Algorithm per §5.2.3:
 * 1. Check if file starts with `---\n` (or `---\r\n`)
 * 2. Find the next occurrence of `\n---\n` (or `\r\n---\r\n`)
 * 3. Extract YAML between delimiters
 * 4. Remainder after closing delimiter is the Markdown body
 *
 * @module
 */

import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

export interface ParsedFrontMatter<T = Record<string, unknown>> {
  frontMatter: T | null;
  body: string;
}

/**
 * Parse YAML front matter from a Markdown string.
 *
 * Returns `{ frontMatter, body }` where frontMatter is null
 * if the file has no front matter block.
 */
export function parseFrontMatter<T = Record<string, unknown>>(
  content: string,
): ParsedFrontMatter<T> {
  // Normalize CRLF to LF for consistent parsing
  const normalized = content.replace(/\r\n/g, '\n');

  // Must start with ---\n
  if (!normalized.startsWith('---\n')) {
    return { frontMatter: null, body: content };
  }

  // Find closing --- (check from position 3 to handle ---\n---\n)
  const closingIndex = normalized.indexOf('\n---\n', 3);
  if (closingIndex === -1) {
    // No closing delimiter — treat entire file as body (no front matter)
    return { frontMatter: null, body: content };
  }

  const yamlContent = normalized.slice(4, closingIndex);
  const body = normalized.slice(closingIndex + 5); // skip \n---\n

  // Parse YAML (empty string → null from yaml parser, so default to {})
  const parsed = yamlContent.trim() === '' ? {} : parseYaml(yamlContent);

  // Ensure we always return an object for front matter
  const frontMatter = (parsed != null && typeof parsed === 'object' ? parsed : {}) as T;

  // Strip leading blank line from body (§2.5.4 says blank line SHOULD follow ---)
  const trimmedBody = body.startsWith('\n') ? body.slice(1) : body;

  return { frontMatter, body: trimmedBody };
}

/**
 * Serialize front matter + body back to a Markdown string.
 *
 * Produces the format:
 * ```
 * ---
 * key: value
 * ---
 *
 * Body content
 * ```
 *
 * Per §2.5.4: closing `---` is followed by a blank line.
 */
export function serializeFrontMatter(
  frontMatter: Record<string, unknown> | null,
  body: string,
): string {
  if (frontMatter === null || Object.keys(frontMatter).length === 0) {
    return body;
  }

  const yamlStr = stringifyYaml(frontMatter, { lineWidth: 0 }).trimEnd();
  return `---\n${yamlStr}\n---\n\n${body}`;
}
