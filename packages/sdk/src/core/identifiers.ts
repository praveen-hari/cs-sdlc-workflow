/**
 * Identifier validation and generation per §2.4.4.
 *
 * @module
 */

import { identifierSchema, decisionIdSchema } from '../schemas/shared.js';
import { slugify } from '../utils/slugify.js';
import { IdentifierError } from './errors.js';

/**
 * Validate a kebab-case identifier (modules, work items).
 * Throws IdentifierError if invalid.
 */
export function validateIdentifier(value: string): string {
  const result = identifierSchema.safeParse(value);
  if (!result.success) {
    const reason = result.error.issues[0]?.message ?? 'invalid identifier';
    throw new IdentifierError(value, reason);
  }
  return result.data;
}

/**
 * Validate a zero-padded 3-digit decision ID.
 * Throws IdentifierError if invalid.
 */
export function validateDecisionId(value: string): string {
  const result = decisionIdSchema.safeParse(value);
  if (!result.success) {
    const reason = result.error.issues[0]?.message ?? 'invalid decision ID';
    throw new IdentifierError(value, reason);
  }
  return result.data;
}

/**
 * Generate a work item ID from a description.
 * Returns a valid kebab-case identifier.
 */
export function generateWorkItemId(description: string): string {
  const slug = slugify(description, 64);
  if (!slug || slug.length < 2) {
    throw new IdentifierError(description, 'Cannot generate a valid identifier from this description');
  }
  return slug;
}

/**
 * Generate the next decision ID by incrementing the highest existing one.
 * Returns a zero-padded 3-digit string.
 */
export function nextDecisionId(existingIds: string[]): string {
  let max = 0;
  for (const id of existingIds) {
    const num = parseInt(id, 10);
    if (!isNaN(num) && num > max) {
      max = num;
    }
  }
  return String(max + 1).padStart(3, '0');
}

/**
 * Resolve a work item ID conflict by appending a numeric suffix.
 * Given existing IDs, returns a unique variant.
 */
export function resolveIdConflict(baseId: string, existingIds: Set<string>): string {
  if (!existingIds.has(baseId)) return baseId;

  let suffix = 2;
  while (existingIds.has(`${baseId}-${suffix}`)) {
    suffix++;
  }
  return `${baseId}-${suffix}`;
}
