/**
 * Convert a title string to a kebab-case slug suitable for
 * work item IDs, decision slugs, and directory names.
 *
 * Rules per §2.4.4:
 * - Lowercase ASCII letters, digits, hyphens only
 * - Starts with a letter
 * - Max 64 characters
 * - No consecutive hyphens
 *
 * @module
 */

/**
 * Convert a human-readable title to a kebab-case slug.
 *
 * @example
 * slugify("Add Dark Mode")        // "add-dark-mode"
 * slugify("Fix Safari Login!!!")   // "fix-safari-login"
 * slugify("123 Numbers First")    // "numbers-first"
 */
export function slugify(title: string, maxLength = 64): string {
  let slug = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .replace(/[^a-z0-9\s-]/g, '')    // remove non-alphanumeric (keep spaces and hyphens)
    .trim()
    .replace(/[\s-]+/g, '-')         // collapse whitespace/hyphens to single hyphen
    .replace(/^-+/, '')              // strip leading hyphens
    .replace(/-+$/, '');             // strip trailing hyphens

  // Must start with a letter — strip leading digits
  slug = slug.replace(/^[0-9-]+/, '');

  // Truncate to max length, but don't cut mid-word
  if (slug.length > maxLength) {
    slug = slug.slice(0, maxLength);
    // Don't end on a hyphen
    slug = slug.replace(/-+$/, '');
  }

  return slug;
}
