import { describe, it, expect } from 'vitest';
import { nowISO, todayDate, currentMonth, monthFromISO } from '../../src/utils/dates.js';

describe('date helpers', () => {
  it('nowISO returns a valid ISO 8601 string', () => {
    const result = nowISO();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('todayDate returns YYYY-MM-DD', () => {
    const result = todayDate();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('currentMonth returns YYYY-MM', () => {
    const result = currentMonth();
    expect(result).toMatch(/^\d{4}-\d{2}$/);
  });

  it('monthFromISO extracts YYYY-MM from ISO string', () => {
    expect(monthFromISO('2026-07-08T10:00:00Z')).toBe('2026-07');
    expect(monthFromISO('2026-12-31T23:59:59.999Z')).toBe('2026-12');
  });
});
