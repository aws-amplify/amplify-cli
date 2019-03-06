const { run } = require('./commands/api/console');
const fs = require('fs-extra');
const RelationalDBTemplateGenerator = require('graphql-relational-schema-transformer').default.RelationalDBTemplateGenerator

const category = 'api';

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
  const datasource = 'Aurora Serverless'
  const { amplify } = context;

  /**
   * Check if we need to do the walkthrough, by looking to see if previous environments have 
   * configured an RDS datasource
   */
  const backendConfigFilePath = amplify.pathManager.getBackendConfigFilePath()
  const backendConfig = JSON.parse(fs.readFileSync(backendConfigFilePath))

  let resourceName;
  for (const api in backendConfig[category]) {
    if (backendConfig[category][api]['service'] === 'AppSync') {
      resourceName = api;
      break;
    }
  }

  // If an AppSync API does not exist, no need to prompt for rds datasource
  if (!resourceName) {
    return;
  }

  // If an AppSync API has not been initialized with RDS, no need to prompt
  if (!backendConfig[category][resourceName]['rdsInit']) {
    return;
  }

  const providerController = require(`./provider-utils/awscloudformation/index`);

  if (!providerController) {
    context.print.error('Provider not configured for this category')
    return;
  }

  /**
   * Check team provider info to ensure it hasn't already been created for current env
   */
  const currEnv = amplify.getEnvInfo().envName;
  const teamProviderInfoFilePath = amplify.pathManager.getProviderInfoFilePath();
  const teamProviderInfo = JSON.parse(fs.readFileSync(teamProviderInfoFilePath))
  if (teamProviderInfo[currEnv][category]
    && teamProviderInfo[currEnv][category][resourceName]
    && teamProviderInfo[currEnv][category][resourceName]
    && teamProviderInfo[currEnv][category][resourceName][datasource]
    && teamProviderInfo[currEnv][category][resourceName][datasource]['rdsRegion']) {
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

    if (!teamProviderInfo[currEnv][category])
      teamProviderInfo[currEnv][category] = {}
    if (!teamProviderInfo[currEnv][category][resourceName])
      teamProviderInfo[currEnv][category][resourceName] = {}
    if (!teamProviderInfo[currEnv][category][resourceName][datasource])
      teamProviderInfo[currEnv][category][resourceName][datasource] = {}

    teamProviderInfo[currEnv][category][resourceName][datasource]['rdsRegion'] = answers.region
    teamProviderInfo[currEnv][category][resourceName][datasource]['rdsClusterIdentifier'] = answers.dbClusterArn
    teamProviderInfo[currEnv][category][resourceName][datasource]['rdsSecretStoreArn'] = answers.secretStoreArn
    teamProviderInfo[currEnv][category][resourceName][datasource]['rdsDatabaseName'] = answers.databaseName

    fs.writeFileSync(teamProviderInfoFilePath, JSON.stringify(teamProviderInfo, null, 4));

    /**
     * Refresh the map in cfn
     */
    const projectBackendDirPath = amplify.pathManager.getBackendDirPath();
    const stacksDir = `${projectBackendDirPath}/${category}/${answers.resourceName}/stacks/`
    fs.ensureDirSync(stacksDir)
    const apiCFNPath = stacksDir + `${answers.resourceName}-rds.json`
    const refreshedCFN = RelationalDBTemplateGenerator.addRefreshMappings(fs.readFileSync(apiCFNPath), context, 'testAPI', datasource)
    fs.writeFileSync(apiCFNPath, refreshedCFN)

    return;
  })
}

module.exports = {
  console,
  migrate,
  initEnv
};
