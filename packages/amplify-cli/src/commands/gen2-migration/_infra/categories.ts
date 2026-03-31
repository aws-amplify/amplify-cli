/**
 * Extract Amplify category from a logical resource ID
 */
export function extractCategory(logicalId: string): string {
  const idLower = logicalId.toLowerCase();
  if (idLower.includes('auth')) return 'Auth';
  if (idLower.includes('storage')) return 'Storage';
  if (idLower.includes('function')) return 'Function';
  if (idLower.includes('api')) return 'Api';
  if (idLower.includes('analytics')) return 'Analytics';
  if (idLower.includes('hosting')) return 'Hosting';
  if (idLower.includes('notifications')) return 'Notifications';
  if (idLower.includes('interactions')) return 'Interactions';
  if (idLower.includes('predictions')) return 'Predictions';
  if (idLower.includes('geo')) return 'Geo';
  if (idLower.includes('custom')) return 'Custom';
  if (idLower.includes('deployment') || idLower.includes('infrastructure') || idLower.includes('core')) return 'Core Infrastructure';
  return 'Other';
}
