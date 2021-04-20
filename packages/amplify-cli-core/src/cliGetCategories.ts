import { stateManager } from './state-manager';

export function getAmplifyResourceByCategories(category: string): any[] {
  const meta = stateManager.getMeta();
  return Object.keys(category).filter(r => meta[category][r].mobileHubMigrated !== true);
}
