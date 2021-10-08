import { stateManager } from '../state-manager';

export const isResourceNameUnique = (category: string, resourceName: string, throwOnMatch = true) => {
  const meta = stateManager.getMeta();
  const resourceNames = Object.keys(meta?.[category] || {});
  const matchIdx = resourceNames.map(name => name.toLowerCase()).indexOf(resourceName.toLowerCase());
  if (matchIdx === -1) {
    return true;
  }

  if (throwOnMatch) {
    const msg = `A resource named '${resourceNames[matchIdx]}' already exists. Amplify resource names must be unique and are case-insensitive.`;
    throw new Error(msg);
  } else {
    return false;
  }
};
