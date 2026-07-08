import { describe, it, expect } from 'vitest';
import {
  SdlcError,
  NotFoundError,
  FileNotFoundError,
  ValidationError,
  IdentifierError,
  ConsistencyError,
  AlreadyExistsError,
  ItemNotFoundError,
} from '../../src/core/errors.js';

describe('SdlcError', () => {
  it('has name, message, and code', () => {
    const err = new SdlcError('test message', 'TEST_CODE');
    expect(err.name).toBe('SdlcError');
    expect(err.message).toBe('test message');
    expect(err.code).toBe('TEST_CODE');
  });

  it('is instanceof Error', () => {
    expect(new SdlcError('x', 'X')).toBeInstanceOf(Error);
  });
});

describe('NotFoundError', () => {
  it('has correct code and is instanceof SdlcError', () => {
    const err = new NotFoundError('/some/path');
    expect(err.code).toBe('SDLC_NOT_FOUND');
    expect(err.name).toBe('NotFoundError');
    expect(err).toBeInstanceOf(SdlcError);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toContain('/some/path');
  });
});

describe('FileNotFoundError', () => {
  it('has correct code', () => {
    const err = new FileNotFoundError('/path/to/file.json');
    expect(err.code).toBe('FILE_NOT_FOUND');
    expect(err.name).toBe('FileNotFoundError');
    expect(err).toBeInstanceOf(SdlcError);
  });
});

describe('ValidationError', () => {
  it('wraps Zod issues and formats message', () => {
    const issues = [
      { path: ['project', 'name'], message: 'Required', code: 'invalid_type' as const, expected: 'string' as const, received: 'undefined' as const },
    ];
    const err = new ValidationError('manifest.json', issues);
    expect(err.code).toBe('VALIDATION_ERROR');
    expect(err.name).toBe('ValidationError');
    expect(err.issues).toHaveLength(1);
    expect(err.message).toContain('project.name');
    expect(err.message).toContain('manifest.json');
    expect(err).toBeInstanceOf(SdlcError);
  });
});

describe('IdentifierError', () => {
  it('includes the invalid value', () => {
    const err = new IdentifierError('Bad_Id', 'must be kebab-case');
    expect(err.code).toBe('IDENTIFIER_ERROR');
    expect(err.message).toContain('Bad_Id');
    expect(err).toBeInstanceOf(SdlcError);
  });
});

describe('ConsistencyError', () => {
  it('has correct code', () => {
    const err = new ConsistencyError('counter mismatch');
    expect(err.code).toBe('CONSISTENCY_ERROR');
    expect(err).toBeInstanceOf(SdlcError);
  });
});

describe('AlreadyExistsError', () => {
  it('has correct code', () => {
    const err = new AlreadyExistsError('/project/.sdlc');
    expect(err.code).toBe('ALREADY_EXISTS');
    expect(err).toBeInstanceOf(SdlcError);
  });
});

describe('ItemNotFoundError', () => {
  it('includes type and id', () => {
    const err = new ItemNotFoundError('Work item', 'add-dark-mode');
    expect(err.code).toBe('ITEM_NOT_FOUND');
    expect(err.message).toContain('Work item');
    expect(err.message).toContain('add-dark-mode');
    expect(err).toBeInstanceOf(SdlcError);
  });
});
