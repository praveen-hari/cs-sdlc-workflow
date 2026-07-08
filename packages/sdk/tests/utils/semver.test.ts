import { describe, it, expect } from 'vitest';
import { compareSemVer } from '../../src/utils/semver.js';

describe('compareSemVer', () => {
  it('compares major versions', () => {
    expect(compareSemVer('2.0.0', '1.0.0')).toBeGreaterThan(0);
    expect(compareSemVer('1.0.0', '2.0.0')).toBeLessThan(0);
  });

  it('compares minor versions', () => {
    expect(compareSemVer('1.2.0', '1.1.0')).toBeGreaterThan(0);
    expect(compareSemVer('1.1.0', '1.2.0')).toBeLessThan(0);
  });

  it('compares patch versions', () => {
    expect(compareSemVer('1.0.2', '1.0.1')).toBeGreaterThan(0);
    expect(compareSemVer('1.0.1', '1.0.2')).toBeLessThan(0);
  });

  it('equal versions return 0', () => {
    expect(compareSemVer('1.0.0', '1.0.0')).toBe(0);
  });

  it('pre-release has lower precedence than release', () => {
    expect(compareSemVer('1.0.0-beta', '1.0.0')).toBeLessThan(0);
    expect(compareSemVer('1.0.0', '1.0.0-beta')).toBeGreaterThan(0);
  });

  it('compares pre-release identifiers lexically', () => {
    expect(compareSemVer('1.0.0-alpha', '1.0.0-beta')).toBeLessThan(0);
    expect(compareSemVer('1.0.0-beta', '1.0.0-alpha')).toBeGreaterThan(0);
  });

  it('two pre-releases with same identifier are equal', () => {
    expect(compareSemVer('1.0.0-rc.1', '1.0.0-rc.1')).toBe(0);
  });

  it('sorts an array of versions correctly', () => {
    const versions = ['1.0.0', '0.2.1-beta', '0.1.0', '2.0.0', '1.0.0-rc.1'];
    const sorted = [...versions].sort(compareSemVer);
    expect(sorted).toEqual(['0.1.0', '0.2.1-beta', '1.0.0-rc.1', '1.0.0', '2.0.0']);
  });
});
