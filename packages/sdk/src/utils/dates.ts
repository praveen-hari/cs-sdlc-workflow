/**
 * ISO 8601 date helpers.
 *
 * @module
 */

/** Return the current timestamp as an ISO 8601 string. */
export function nowISO(): string {
  return new Date().toISOString();
}

/** Return today's date as a YYYY-MM-DD string. */
export function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Return the current month as a YYYY-MM string. */
export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

/** Extract YYYY-MM from an ISO 8601 date-time string. */
export function monthFromISO(iso: string): string {
  return iso.slice(0, 7);
}
