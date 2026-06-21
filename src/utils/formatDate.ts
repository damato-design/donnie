/**
 * Date formatting helpers
 *
 * Centralizes the two `Intl.DateTimeFormat` variants used across the site so the
 * same locale/format choices are defined once.
 */

/**
 * Formats a date as "Month Year" (e.g. "June 2024").
 *
 * Used by cards and timeline entries where the day is not relevant.
 */
export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
  }).format(date);
}

/**
 * Formats a date as "Mon Year" (e.g. "Jun 2024").
 *
 * Used in compact contexts such as related-content lists.
 */
export function formatMonthShortYear(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
  }).format(date);
}

/**
 * Formats a date as "Month Day, Year" (e.g. "June 15, 2024").
 *
 * Used by article/writing entries where the exact day matters.
 */
export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}
