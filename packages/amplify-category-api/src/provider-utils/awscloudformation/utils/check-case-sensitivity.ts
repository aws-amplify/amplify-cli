import { stateManager } from 'amplify-cli-core';

export const isNameUnique = (category: string, resourceName: string, throwOnMatch = true) => {
  const resourceNames = Object.keys(stateManager.getMeta()?.[category] || {});
  const matchIdx = resourceNames.map(name => name.toLowerCase()).indexOf(resourceName.toLowerCase());
  if (matchIdx === -1) {
    return true;
  }
  const msg = `A resource named ${resourceNames[matchIdx]} already exists. Amplify resource names must be unique and are case-insensitive.`;
  if (throwOnMatch) {
    throw new Error(msg);
  } else {
    return msg;
  }
};
