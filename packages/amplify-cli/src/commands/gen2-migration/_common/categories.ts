/**
 * Extract Amplify category from a logical resource ID.
 */
const CATEGORY_PREFIXES = [
  ['auth', 'Auth'],
  ['storage', 'Storage'],
  ['function', 'Function'],
  ['api', 'Api'],
  ['analytics', 'Analytics'],
  ['hosting', 'Hosting'],
  ['notifications', 'Notifications'],
  ['interactions', 'Interactions'],
  ['predictions', 'Predictions'],
  ['geo', 'Geo'],
  ['custom', 'Custom'],
] as const;

export function extractCategory(logicalId: string): string {
  const idLower = logicalId.toLowerCase();
  const category = CATEGORY_PREFIXES.find(([prefix]) => idLower.startsWith(prefix));
  if (category) return category[1];
  if (idLower.startsWith('deployment') || idLower.startsWith('infrastructure') || idLower.startsWith('core')) return 'Core Infrastructure';
  return 'Other';
}
