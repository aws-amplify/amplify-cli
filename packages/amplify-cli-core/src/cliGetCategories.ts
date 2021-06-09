import { stateManager } from './state-manager';

export function getAmplifyResourceByCategories(category: string): string[] {
  const meta = stateManager.getMeta();
  return Object.keys(meta[category] || {}).filter(r => meta[category][r].mobileHubMigrated !== true);
}
