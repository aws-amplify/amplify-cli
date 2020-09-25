import { $TSContext, stateManager } from 'amplify-cli-core';

export const ensureMobileHubCommandCompatibility = (context: $TSContext): boolean => {
  checkIfMobileHubProject(context);

  // Only do further checks if it is mobile hub migrated project
  if (context.migrationInfo.projectHasMobileHubResources !== true) {
    return true;
  }

  return isCommandSupported(context);
};

const checkIfMobileHubProject = (context: $TSContext): void => {
  const meta = stateManager.getMeta(undefined, { throwIfNotExist: false });

  if (!meta) {
    return;
  }

  let hasMigratedResources = false;

  Object.keys(meta).forEach(category => {
    Object.keys(meta[category]).forEach(resourceName => {
      const resource = meta[category][resourceName];

      // Mobile hub migrated resources does not have an assigned provider
      if (!resource.providerPlugin) {
        hasMigratedResources = true;
      }
    });
  });

  context.migrationInfo = { ...context.migrationInfo, projectHasMobileHubResources: hasMigratedResources };
};

const isCommandSupported = (context: $TSContext): boolean => {
  const { command, plugin } = context.input;

  // env commands are not supported for projects that having resources without provider assigned
  if (command === 'env') {
    context.print.error(`multi-environment support is not available for Amplify projects with Mobile Hub migrated resources.`);

    return false;
  }

  return true;
};
