import { stateManager } from '../state-manager';

// Currently not used in this project, but there are dependencies in other projects https://github.com/search?q=org%3Aaws-amplify+isResourceNameUnique&type=code
export const isResourceNameUnique = (category: string, resourceName: string, throwOnMatch = true) => {
  const meta = stateManager.getMeta();
  const resourceNames = Object.keys(meta?.[category] || {});
  const matchIdx = resourceNames.map((name) => name.toLowerCase()).indexOf(resourceName.toLowerCase());
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
