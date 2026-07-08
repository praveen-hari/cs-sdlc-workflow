import { describe, it, expect } from 'vitest';
import { parseFrontMatter, serializeFrontMatter } from '../../src/core/frontmatter.js';

describe('parseFrontMatter', () => {
  it('parses valid front matter', () => {
    const content = `---\ntitle: Hello\nversion: 1\n---\n\n# Heading\n\nBody text.`;
    const result = parseFrontMatter(content);
    expect(result.frontMatter).toEqual({ title: 'Hello', version: 1 });
    expect(result.body).toBe('# Heading\n\nBody text.');
  });

  it('returns null frontMatter for files without front matter', () => {
    const content = '# Just Markdown\n\nNo front matter here.';
    const result = parseFrontMatter(content);
    expect(result.frontMatter).toBeNull();
    expect(result.body).toBe(content);
  });

  it('handles empty YAML block', () => {
    const content = '---\n---\n\n# Heading';
    const result = parseFrontMatter(content);
    expect(result.frontMatter).toEqual({});
    expect(result.body).toBe('# Heading');
  });

  it('handles CRLF line endings', () => {
    const content = '---\r\ntitle: Test\r\n---\r\n\r\n# Heading';
    const result = parseFrontMatter(content);
    expect(result.frontMatter).toEqual({ title: 'Test' });
    expect(result.body).toBe('# Heading');
  });

  it('returns null frontMatter when no closing ---', () => {
    const content = '---\ntitle: Broken\n# No closing delimiter';
    const result = parseFrontMatter(content);
    expect(result.frontMatter).toBeNull();
    expect(result.body).toBe(content);
  });

  it('preserves unknown YAML keys (§9.6.1)', () => {
    const content = '---\nknown: true\nfutureKey: value\n---\n\nBody';
    const result = parseFrontMatter(content);
    expect(result.frontMatter).toEqual({ known: true, futureKey: 'value' });
  });

  it('handles nested YAML objects', () => {
    const content = '---\nstack:\n  language: typescript\n  framework: react\n---\n\nBody';
    const result = parseFrontMatter(content);
    expect(result.frontMatter).toEqual({
      stack: { language: 'typescript', framework: 'react' },
    });
  });

  it('handles YAML arrays', () => {
    const content = '---\nmodules:\n  - web-app\n  - auth-service\n---\n\nBody';
    const result = parseFrontMatter(content);
    expect(result.frontMatter).toEqual({ modules: ['web-app', 'auth-service'] });
  });

  it('handles body with --- in content (not at start of line)', () => {
    const content = '---\ntitle: Test\n---\n\nSome text with --- in it.';
    const result = parseFrontMatter(content);
    expect(result.frontMatter).toEqual({ title: 'Test' });
    expect(result.body).toBe('Some text with --- in it.');
  });

  it('handles empty body', () => {
    const content = '---\ntitle: Test\n---\n\n';
    const result = parseFrontMatter(content);
    expect(result.frontMatter).toEqual({ title: 'Test' });
    expect(result.body).toBe('');
  });

  it('handles empty string', () => {
    const result = parseFrontMatter('');
    expect(result.frontMatter).toBeNull();
    expect(result.body).toBe('');
  });
});

describe('serializeFrontMatter', () => {
  it('serializes front matter + body', () => {
    const result = serializeFrontMatter({ title: 'Hello', version: 1 }, '# Heading\n\nBody.');
    expect(result).toContain('---\n');
    expect(result).toContain('title: Hello');
    expect(result).toContain('version: 1');
    expect(result).toContain('\n---\n\n# Heading');
  });

  it('returns body only when frontMatter is null', () => {
    expect(serializeFrontMatter(null, '# Body')).toBe('# Body');
  });

  it('returns body only when frontMatter is empty object', () => {
    expect(serializeFrontMatter({}, '# Body')).toBe('# Body');
  });

  it('round-trips correctly', () => {
    const original = { type: 'feature', title: 'Add Dark Mode', modules: ['web-app'] };
    const body = '# Add Dark Mode\n\n## What\nAdd dark mode support.';

    const serialized = serializeFrontMatter(original, body);
    const parsed = parseFrontMatter(serialized);

    expect(parsed.frontMatter).toEqual(original);
    expect(parsed.body).toBe(body);
  });

  it('preserves unknown keys on round-trip', () => {
    const original = { known: 'value', futureKey: 42 };
    const body = 'Body text';

    const serialized = serializeFrontMatter(original, body);
    const parsed = parseFrontMatter(serialized);

    expect(parsed.frontMatter).toEqual(original);
  });
});
