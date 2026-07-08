import { describe, it, expect } from 'vitest';
import { slugify } from '../../src/utils/slugify.js';

describe('slugify', () => {
  it('converts title to kebab-case', () => {
    expect(slugify('Add Dark Mode')).toBe('add-dark-mode');
  });

  it('strips special characters', () => {
    expect(slugify('Fix Safari Login!!!')).toBe('fix-safari-login');
  });

  it('strips leading digits', () => {
    expect(slugify('123 Numbers First')).toBe('numbers-first');
  });

  it('collapses multiple spaces and hyphens', () => {
    expect(slugify('too   many   spaces')).toBe('too-many-spaces');
    expect(slugify('too---many---hyphens')).toBe('too-many-hyphens');
  });

  it('handles diacritics', () => {
    expect(slugify('Café Résumé')).toBe('cafe-resume');
  });

  it('truncates to max length', () => {
    const long = 'a very long title that exceeds the maximum allowed length for identifiers in the spec';
    const result = slugify(long, 64);
    expect(result.length).toBeLessThanOrEqual(64);
    expect(result).not.toMatch(/-$/); // no trailing hyphen
  });

  it('handles empty string', () => {
    expect(slugify('')).toBe('');
  });

  it('handles all-digit input', () => {
    expect(slugify('12345')).toBe('');
  });

  it('handles mixed case', () => {
    expect(slugify('MyComponent')).toBe('mycomponent');
  });

  it('strips leading/trailing whitespace', () => {
    expect(slugify('  hello world  ')).toBe('hello-world');
  });
});
