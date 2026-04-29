import * as ini from 'ini';

/**
 * Add or replace a single INI section inside `existing`, preserving every
 * other section's key/value pairs. Implemented as a parse-merge-serialize
 * round-trip using the `ini` package.
 *
 * Idempotent: for any `existing`, `header`, `values`,
 *   mergeManagedSection(mergeManagedSection(e, h, v), h, v) === mergeManagedSection(e, h, v).
 *
 * Total: never throws. `ini.parse` silently skips lines it cannot interpret,
 * so any input — including binary — produces a well-formed INI output with
 * the managed section present.
 *
 * Comments, custom whitespace, key ordering within a section, and quoting
 * style are not preserved across the round-trip. Only the semantic key/value
 * pairs of each section survive.
 *
 * @param existing Previous file contents (possibly empty).
 * @param header   The section name without brackets. For the AWS credentials
 *                 file this is the profile name (e.g. `amplify-migration-e2e-x`).
 *                 For the AWS config file it is the `profile <name>` form.
 * @param values   The key/value pairs for the managed section.
 * @returns The new file contents, always ending in exactly one `\n`.
 */
export function mergeManagedSection(existing: string, header: string, values: Record<string, string>): string {
  const parsed = ini.parse(existing) as Record<string, unknown>;
  parsed[header] = { ...values };
  const serialized = ini.stringify(parsed);
  return ensureTrailingNewline(serialized);
}

/**
 * Normalize `text` to end with exactly one `\n`. Handles both Unix (`\n`)
 * and Windows (`\r\n`) line endings that `ini.stringify` may emit on
 * different platforms.
 */
function ensureTrailingNewline(text: string): string {
  const trimmed = text.replace(/[\r\n]+$/, '');
  return trimmed + '\n';
}
