const inquirer = require('inquirer');
const ora = require('ora');
const { DataApiParams } = require('graphql-relational-schema-transformer');

const spinner = ora('');
const category = 'api';
const providerName = 'awscloudformation';

async function serviceWalkthrough(context, defaultValuesFilename, datasourceMetadata) {
  const amplifyMeta = context.amplify.getProjectMeta();

  // Verify that an API exists in the project before proceeding.
  if (amplifyMeta == null || amplifyMeta[category] == null
   || Object.keys(amplifyMeta[category]).length === 0) {
    context.print.error('You must create an AppSync API in your project before adding a graphql datasource. Please use "amplify api add" to create the API.');
    process.exit(0);
  }

  // Loop through to find the AppSync API Resource Name
  let appSyncApi;
  const apis = Object.keys(amplifyMeta[category]);

  for (let i = 0; i < apis.length; i += 1) {
    if (amplifyMeta[category][apis[i]].service === 'AppSync') {
      appSyncApi = apis[i];
      break;
    }
  }

  // If an AppSync API does not exist, inform the user to create the AppSync API
  if (!appSyncApi) {
    context.print.error('You must create an AppSync API in your project before adding a graphql datasource. Please use "amplify api add" to create the API.');
    process.exit(0);
  }

  const { inputs, availableRegions } = datasourceMetadata;

  // Region Question
  const selectedRegion = await promptWalkthroughQuestion(inputs, 0, availableRegions);

  const AWS = await getAwsClient(context, 'list');

  // Prepare the SDK with the region
  AWS.config.update({
    region: selectedRegion,
  });

  // RDS Cluster Question
  const { selectedClusterArn, clusterResourceId } = await selectCluster(inputs, AWS);

  // Secret Store Question
  const selectedSecretArn = await getSecretStoreArn(inputs, clusterResourceId, AWS);

  // Database Name Question
  const selectedDatabase = await selectDatabase(inputs, selectedClusterArn, selectedSecretArn, AWS);

  return {
    region: selectedRegion,
    dbClusterArn: selectedClusterArn,
    secretStoreArn: selectedSecretArn,
    databaseName: selectedDatabase,
    resourceName: appSyncApi,
  };
}

/**
 *
 * @param {*} inputs
 */
async function selectCluster(inputs, AWS) {
  const RDS = new AWS.RDS();

  const describeDBClustersResult = await RDS.describeDBClusters().promise();
  const rawClusters = describeDBClustersResult.DBClusters;
  const clusters = new Map();

  for (let i = 0; i < rawClusters.length; i += 1) {
    if (rawClusters[i].EngineMode === 'serverless') {
      clusters.set(rawClusters[i].DBClusterIdentifier, rawClusters[i]);
    }
  }

  const clusterIdentifier = await promptWalkthroughQuestion(inputs, 1, Array.from(clusters.keys()));
  const selectedCluster = clusters.get(clusterIdentifier);

  return {
    selectedClusterArn: selectedCluster.DBClusterArn,
    clusterResourceId: selectedCluster.DbClusterResourceId,
  };
}

/**
 *
 * @param {*} inputs
 * @param {*} clusterResourceId
 */
async function getSecretStoreArn(inputs, clusterResourceId, AWS) {
  const SecretsManager = new AWS.SecretsManager();
  const NextToken = 'NextToken';
  let rawSecrets = [];
  const params = {
    MaxResults: 20,
  };

  const listSecretsResult = await SecretsManager.listSecrets(params).promise();
  rawSecrets = listSecretsResult.SecretList;
  let token = listSecretsResult.NextToken;
  while (token) {
    params[NextToken] = token;
    const tempSecretsResult = await SecretsManager.listSecrets(params).promise();
    rawSecrets = [...rawSecrets, ...tempSecretsResult.SecretList];
    token = tempSecretsResult.NextToken;
  }

  const secrets = new Map();
  let selectedSecretArn;

  for (let i = 0; i < rawSecrets.length; i += 1) {
    /**
     * Attempt to auto-detect Secret Store that was created by Aurora Serverless
     * as it follows a specfic format for the Secret Name
     */
    if (rawSecrets[i].Name.startsWith(`rds-db-credentials/${clusterResourceId}`)) {
      // Found the secret store - store the details and break out.
      selectedSecretArn = rawSecrets[i].ARN;
      break;
    }
    secrets.set(rawSecrets[i].Name, rawSecrets[i].ARN);
  }

  if (!selectedSecretArn) {
    // Kick off questions flow
    const selectedSecretName
     = await promptWalkthroughQuestion(inputs, 2, Array.from(secrets.keys()));
    selectedSecretArn = secrets.get(selectedSecretName);
  }

  return selectedSecretArn;
}

/**
 *
 * @param {*} inputs
 * @param {*} clusterArn
 * @param {*} secretArn
 */
async function selectDatabase(inputs, clusterArn, secretArn, AWS) {
  // Database Name Question
  const DataApi = new AWS.RDSDataService();
  const params = new DataApiParams();
  params.secretArn = secretArn;
  params.resourceArn = clusterArn;
  params.sql = 'SHOW databases';

  spinner.start('Fetching Aurora Serverless cluster...');
  const dataApiResult = await DataApi.executeStatement(params).promise();

  // eslint-disable-next-line prefer-destructuring
  const records
   = dataApiResult.records;
  const databaseList = [];

  for (let i = 0; i < records.length; i += 1) {
    const recordValue = records[i][0].stringValue;
    // ignore the three meta tables that the cluster creates
    if (!['information_schema', 'performance_schema', 'mysql'].includes(recordValue)) {
      databaseList.push(recordValue);
    }
  }

  spinner.succeed('Fetched Aurora Serverless cluster.');

  return await promptWalkthroughQuestion(inputs, 3, databaseList);
}

/**
 *
 * @param {*} inputs
 * @param {*} questionNumber
 * @param {*} choicesList
 */
async function promptWalkthroughQuestion(inputs, questionNumber, choicesList) {
  const question = [
    {
      type: inputs[questionNumber].type,
      name: inputs[questionNumber].key,
      message: inputs[questionNumber].question,
      choices: choicesList,
    },
  ];

  const answer = await inquirer.prompt(question);
  return answer[inputs[questionNumber].key];
}

async function getAwsClient(context, action) {
  const providerPlugins = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugins[providerName]);
  return await provider.getConfiguredAWSClient(context, 'aurora-serverless', action);
}

module.exports = {
  serviceWalkthrough,
};
