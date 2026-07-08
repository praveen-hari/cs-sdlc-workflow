/**
 * Minimal SemVer 2.0 comparison for release ordering per §4.4.3.
 *
 * @module
 */

interface ParsedSemVer {
  major: number;
  minor: number;
  patch: number;
  prerelease: string;
}

/** Parse a SemVer string into components. */
function parse(version: string): ParsedSemVer {
  const [core, prerelease = ''] = version.split('-', 2);
  const [major = 0, minor = 0, patch = 0] = (core ?? '')
    .split('.')
    .map(Number);
  return { major, minor, patch, prerelease: prerelease.split('+')[0] ?? '' };
}

/**
 * Compare two SemVer strings.
 * Returns negative if a < b, positive if a > b, 0 if equal.
 * Pre-release versions have lower precedence than release versions.
 */
export function compareSemVer(a: string, b: string): number {
  const pa = parse(a);
  const pb = parse(b);

  // Compare major.minor.patch
  if (pa.major !== pb.major) return pa.major - pb.major;
  if (pa.minor !== pb.minor) return pa.minor - pb.minor;
  if (pa.patch !== pb.patch) return pa.patch - pb.patch;

  // Pre-release has lower precedence than no pre-release
  if (pa.prerelease && !pb.prerelease) return -1;
  if (!pa.prerelease && pb.prerelease) return 1;
  if (!pa.prerelease && !pb.prerelease) return 0;

  // Compare pre-release identifiers lexically
  return pa.prerelease.localeCompare(pb.prerelease);
}
