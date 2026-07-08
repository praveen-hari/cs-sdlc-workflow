import { describe, it, expect } from 'vitest';
import {
  validateIdentifier,
  validateDecisionId,
  generateWorkItemId,
  nextDecisionId,
  resolveIdConflict,
} from '../../src/core/identifiers.js';
import { IdentifierError } from '../../src/core/errors.js';

describe('validateIdentifier', () => {
  it('accepts valid identifiers', () => {
    expect(validateIdentifier('add-dark-mode')).toBe('add-dark-mode');
    expect(validateIdentifier('web-app')).toBe('web-app');
  });

  it('throws IdentifierError for invalid identifiers', () => {
    expect(() => validateIdentifier('Bad_Id')).toThrow(IdentifierError);
    expect(() => validateIdentifier('a')).toThrow(IdentifierError);
    expect(() => validateIdentifier('--fix')).toThrow(IdentifierError);
  });
});

describe('validateDecisionId', () => {
  it('accepts valid decision IDs', () => {
    expect(validateDecisionId('001')).toBe('001');
    expect(validateDecisionId('042')).toBe('042');
  });

  it('throws for invalid decision IDs', () => {
    expect(() => validateDecisionId('1')).toThrow(IdentifierError);
    expect(() => validateDecisionId('abc')).toThrow(IdentifierError);
  });
});

describe('generateWorkItemId', () => {
  it('generates slug from description', () => {
    expect(generateWorkItemId('Add Dark Mode')).toBe('add-dark-mode');
    expect(generateWorkItemId('Fix Safari Login Bug')).toBe('fix-safari-login-bug');
  });

  it('throws for descriptions that produce empty slugs', () => {
    expect(() => generateWorkItemId('')).toThrow(IdentifierError);
    expect(() => generateWorkItemId('12345')).toThrow(IdentifierError);
  });
});

describe('nextDecisionId', () => {
  it('returns 001 for empty list', () => {
    expect(nextDecisionId([])).toBe('001');
  });

  it('increments the highest existing ID', () => {
    expect(nextDecisionId(['001', '002', '003'])).toBe('004');
  });

  it('handles non-sequential IDs', () => {
    expect(nextDecisionId(['001', '005', '003'])).toBe('006');
  });

  it('handles single-digit max', () => {
    expect(nextDecisionId(['001'])).toBe('002');
  });
});

describe('resolveIdConflict', () => {
  it('returns base ID if no conflict', () => {
    expect(resolveIdConflict('add-auth', new Set())).toBe('add-auth');
    expect(resolveIdConflict('add-auth', new Set(['other-item']))).toBe('add-auth');
  });

  it('appends -2 on first conflict', () => {
    expect(resolveIdConflict('add-auth', new Set(['add-auth']))).toBe('add-auth-2');
  });

  it('increments suffix until unique', () => {
    const existing = new Set(['add-auth', 'add-auth-2', 'add-auth-3']);
    expect(resolveIdConflict('add-auth', existing)).toBe('add-auth-4');
  });
});
