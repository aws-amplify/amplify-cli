import CLITable from 'cli-table3';
import { ResourceMapping } from './workflow/category-refactorer';

/**
 * Renders a table of resource mappings for move operations.
 */
export function formatMoveTable(
  resourceMappings: readonly ResourceMapping[],
  physicalIds: ReadonlyMap<string, string>,
  resourceTypes: ReadonlyMap<string, string>,
): string {
  const table = new CLITable({
    head: ['Type', 'Source Logical ID', 'Target Logical ID', 'Physical ID'],
    style: { head: [] },
  });

  for (const m of resourceMappings) {
    table.push([
      resourceTypes.get(m.Source.LogicalResourceId) ?? '',
      m.Source.LogicalResourceId,
      m.Destination.LogicalResourceId,
      physicalIds.get(m.Source.LogicalResourceId) ?? '',
    ]);
  }

  return table.toString();
}
