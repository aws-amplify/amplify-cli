import * as ini from 'ini';

/**
 * Add or replace a single INI section inside `existing`, preserving every
 * other section's key/value pairs. Uses `ini.parse` to read the existing
 * contents and a hand-rolled serializer to write them back out in the
 * AWS shared-ini format.
 *
 * Idempotent: for any `existing`, `header`, `values`,
 *   mergeManagedSection(mergeManagedSection(e, h, v), h, v) === mergeManagedSection(e, h, v).
 *
 * Total: never throws. `ini.parse` silently skips lines it cannot interpret,
 * so any input — including binary — produces a well-formed output with the
 * managed section present.
 *
 * Comments, custom whitespace, key ordering within a section, and quoting
 * style are not preserved across the round-trip. Only the semantic key/value
 * pairs of each section survive.
 *
 * ### Why not `ini.stringify`?
 *
 * The `ini` package wraps any value matching `/[=\r\n]/` in `JSON.stringify`
 * (e.g. `key="val=ue"`). The AWS SDK's shared-ini parser does **not** strip
 * those quotes — it treats them as literal characters of the value. STS
 * session tokens are base64 strings that routinely contain `=` as padding,
 * so `ini.stringify` would break every role-mode refresh by writing tokens
 * that the SDK reads back with extra quote characters attached. We emit
 * raw `key=value` lines instead, which is what the AWS CLI itself writes
 * and what the SDK is designed to parse.
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
  return serializeIni(parsed);
}

/**
 * Serialize a parsed INI map to the AWS shared-ini format: one section per
 * `[header]` line followed by `key=value` lines, sections separated by a
 * blank line, and the whole file terminated by exactly one `\n`. Nested
 * objects (sub-sections) and non-string values are skipped — both the
 * credentials and config files are flat string-to-string maps.
 */
function serializeIni(parsed: Record<string, unknown>): string {
  const sections: string[] = [];
  for (const [header, body] of Object.entries(parsed)) {
    if (!isStringRecord(body)) {
      continue;
    }
    const lines = [`[${header}]`];
    for (const [key, value] of Object.entries(body)) {
      lines.push(`${key}=${value}`);
    }
    sections.push(lines.join('\n'));
  }
  return sections.length === 0 ? '\n' : sections.join('\n\n') + '\n';
}

/**
 * True when `value` is a plain object whose values are all strings. We skip
 * anything else because the AWS shared-ini format is strictly flat — sub-
 * sections from `ini.parse` (e.g. `a.b = 1`) and array values have no
 * representation in the files we care about.
 */
function isStringRecord(value: unknown): value is Record<string, string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  return Object.values(value as Record<string, unknown>).every((v) => typeof v === 'string');
}
