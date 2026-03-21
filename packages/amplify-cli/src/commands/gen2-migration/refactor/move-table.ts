import { ResourceMapping } from './workflow/category-refactorer';

/**
 * Renders a box-drawing table of resource mappings for move operations.
 */
export function formatMoveTable(
  resourceMappings: readonly ResourceMapping[],
  physicalIds: ReadonlyMap<string, string>,
  resourceTypes: ReadonlyMap<string, string>,
): string {
  const rows = resourceMappings.map((m) => ({
    type: resourceTypes.get(m.Source.LogicalResourceId) ?? '',
    source: m.Source.LogicalResourceId,
    target: m.Destination.LogicalResourceId,
    physical: physicalIds.get(m.Source.LogicalResourceId) ?? '',
  }));

  const w = {
    type: Math.max(4, ...rows.map((r) => r.type.length)) + 2,
    source: Math.max(6, ...rows.map((r) => r.source.length)) + 2,
    target: Math.max(6, ...rows.map((r) => r.target.length)) + 2,
    physical: Math.max(8, ...rows.map((r) => r.physical.length)) + 2,
  };

  const hr = (c: string, l: string, m: string, r: string) =>
    `${l}${''.padEnd(w.type, c)}${m}${''.padEnd(w.source, c)}${m}${''.padEnd(w.target, c)}${m}${''.padEnd(w.physical, c)}${r}`;
  const row = (ty: string, s: string, t: string, p: string) =>
    `│ ${ty.padEnd(w.type - 2)} │ ${s.padEnd(w.source - 2)} │ ${t.padEnd(w.target - 2)} │ ${p.padEnd(w.physical - 2)} │`;

  return [
    hr('─', '┌', '┬', '┐'),
    row('Type', 'Source Logical ID', 'Target Logical ID', 'Physical ID'),
    hr('─', '├', '┼', '┤'),
    ...rows.map((r) => row(r.type, r.source, r.target, r.physical)),
    hr('─', '└', '┴', '┘'),
    '',
  ].join('\n');
}
