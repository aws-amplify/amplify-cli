const { run } = require('./commands/api/console');
const fs = require('fs-extra');

const category = 'api';
const categories = 'categories';

async function console(context) {
  await run(context);
}

async function migrate(context, serviceName) {
  const { projectPath, amplifyMeta } = context.migrationInfo;
  const migrateResourcePromises = [];
  Object.keys(amplifyMeta).forEach((categoryName) => {
    if (categoryName === category) {
      Object.keys(amplifyMeta[category]).forEach((resourceName) => {
        try {
          if (amplifyMeta[category][resourceName].providerPlugin) {
            const providerController = require(`./provider-utils/${amplifyMeta[category][resourceName].providerPlugin}/index`);
            if (providerController) {
              if (!serviceName || serviceName === amplifyMeta[category][resourceName].service) {
                migrateResourcePromises.push(providerController.migrateResource(
                  context,
                  projectPath,
                  amplifyMeta[category][resourceName].service,
                  resourceName,
                ));
              }
            }
          } else {
            context.print.error(`Provider not configured for ${category}: ${resourceName}`);
          }
        } catch (e) {
          context.print.warning(`Could not run migration for ${category}: ${resourceName}`);
          throw e;
        }
      });
    }
  });

  await Promise.all(migrateResourcePromises);
}

async function initEnv(context) {
  const datasource = 'Aurora Serverless';
  const service = 'service';
  const rdsInit = 'rdsInit';
  const rdsRegion = 'rdsRegion';
  const rdsClusterIdentifier = 'rdsClusterIdentifier';
  const rdsSecretStoreArn = 'rdsSecretStoreArn';
  const rdsDatabaseName = 'rdsDatabaseName';

  const { amplify } = context;

  /**
   * Check if we need to do the walkthrough, by looking to see if previous environments have
   * configured an RDS datasource
   */
  const backendConfigFilePath = amplify.pathManager.getBackendConfigFilePath();
  const backendConfig = amplify.readJsonFile(backendConfigFilePath);

  if (!backendConfig[category]) {
    return;
  }

  let resourceName;
  const apis = Object.keys(backendConfig[category]);
  for (let i = 0; i < apis.length; i += 1) {
    if (backendConfig[category][apis[i]][service] === 'AppSync') {
      resourceName = apis[i];
      break;
    }
  }

  // If an AppSync API does not exist, no need to prompt for rds datasource
  if (!resourceName) {
    return;
  }

  // If an AppSync API has not been initialized with RDS, no need to prompt
  if (!backendConfig[category][resourceName][rdsInit]) {
    return;
  }

  const providerController = require('./provider-utils/awscloudformation/index');

  if (!providerController) {
    context.print.error('Provider not configured for this category');
    return;
  }

  /**
   * Check team provider info to ensure it hasn't already been created for current env
   */
  const currEnv = amplify.getEnvInfo().envName;
  const teamProviderInfoFilePath = amplify.pathManager.getProviderInfoFilePath();
  const teamProviderInfo = amplify.readJsonFile(teamProviderInfoFilePath);
  if (teamProviderInfo[currEnv][categories]
    && teamProviderInfo[currEnv][categories][category]
    && teamProviderInfo[currEnv][categories][category][resourceName]
    && teamProviderInfo[currEnv][categories][category][resourceName]
    && teamProviderInfo[currEnv][categories][category][resourceName][rdsRegion]) {
    return;
  }

  /**
   * Execute the walkthrough
   */
  return providerController.addDatasource(context, category, datasource)
    .then((answers) => {
    /**
     * Write the new answers to the team provider info
     */
      if (!teamProviderInfo[currEnv][categories]) {
        teamProviderInfo[currEnv][categories] = {};
      }
      if (!teamProviderInfo[currEnv][categories][category]) {
        teamProviderInfo[currEnv][categories][category] = {};
      }
      if (!teamProviderInfo[currEnv][categories][category][resourceName]) {
        teamProviderInfo[currEnv][categories][category][resourceName] = {};
      }

      teamProviderInfo[currEnv][categories][category][resourceName][rdsRegion]
       = answers.region;
      teamProviderInfo[currEnv][categories][category][resourceName][rdsClusterIdentifier]
       = answers.dbClusterArn;
      teamProviderInfo[currEnv][categories][category][resourceName][rdsSecretStoreArn]
       = answers.secretStoreArn;
      teamProviderInfo[currEnv][categories][category][resourceName][rdsDatabaseName]
       = answers.databaseName;

      fs.writeFileSync(teamProviderInfoFilePath, JSON.stringify(teamProviderInfo, null, 4));
    })
    .then(() => {
      context.amplify.executeProviderUtils(context, 'awscloudformation', 'compileSchema', { noConfig: true, forceCompile: true });
    });
}

async function getPermissionPolicies(context, resourceOpsMapping) {
  const amplifyMetaFilePath = context.amplify.pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = context.amplify.readJsonFile(amplifyMetaFilePath);
  const permissionPolicies = [];
  const resourceAttributes = [];

  Object.keys(resourceOpsMapping).forEach((resourceName) => {
    try {
      const providerController = require(`./provider-utils/${amplifyMeta[category][resourceName].providerPlugin}/index`);
      if (providerController) {
        const { policy, attributes } = providerController.getPermissionPolicies(
          context,
          amplifyMeta[category][resourceName].service,
          resourceName,
          resourceOpsMapping[resourceName],
        );
        permissionPolicies.push(policy);
        resourceAttributes.push({ resourceName, attributes, category });
      } else {
        context.print.error(`Provider not configured for ${category}: ${resourceName}`);
      }
    } catch (e) {
      context.print.warning(`Could not get policies for ${category}: ${resourceName}`);
      throw e;
    }
  });
  return { permissionPolicies, resourceAttributes };
}

module.exports = {
  console,
  migrate,
  initEnv,
  getPermissionPolicies,
};
