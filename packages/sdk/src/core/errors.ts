/**
 * SDK error hierarchy.
 *
 * All errors extend SdlcError for easy catch filtering:
 *   try { ... } catch (e) { if (e instanceof SdlcError) { ... } }
 *
 * @module
 */

import type { ZodIssue } from 'zod';

/** Base error for all SDK operations. */
export class SdlcError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'SdlcError';
  }
}

/** No .sdlc/ directory found at or above the given path. */
export class NotFoundError extends SdlcError {
  constructor(path: string) {
    super(`No .sdlc/ directory found at or above: ${path}`, 'SDLC_NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/** A file expected by the SDK does not exist. */
export class FileNotFoundError extends SdlcError {
  constructor(filePath: string) {
    super(`File not found: ${filePath}`, 'FILE_NOT_FOUND');
    this.name = 'FileNotFoundError';
  }
}

/** Data failed Zod schema validation. */
export class ValidationError extends SdlcError {
  public readonly issues: ZodIssue[];

  constructor(file: string, issues: ZodIssue[]) {
    const summary = issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    super(`Validation failed for ${file}: ${summary}`, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

/** An identifier does not conform to §2.4.4 rules. */
export class IdentifierError extends SdlcError {
  constructor(value: string, reason: string) {
    super(`Invalid identifier "${value}": ${reason}`, 'IDENTIFIER_ERROR');
    this.name = 'IdentifierError';
  }
}

/** Manifest/index/filesystem consistency invariant violated (§7.7). */
export class ConsistencyError extends SdlcError {
  constructor(message: string) {
    super(message, 'CONSISTENCY_ERROR');
    this.name = 'ConsistencyError';
  }
}

/** A .sdlc/ directory already exists (e.g., during init). */
export class AlreadyExistsError extends SdlcError {
  constructor(path: string) {
    super(`.sdlc/ directory already exists at: ${path}`, 'ALREADY_EXISTS');
    this.name = 'AlreadyExistsError';
  }
}

/** A work item, decision, or release was not found. */
export class ItemNotFoundError extends SdlcError {
  constructor(type: string, id: string) {
    super(`${type} not found: ${id}`, 'ITEM_NOT_FOUND');
    this.name = 'ItemNotFoundError';
  }
}
