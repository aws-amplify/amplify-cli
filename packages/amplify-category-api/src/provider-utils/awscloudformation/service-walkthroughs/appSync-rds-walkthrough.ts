import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { DataApiParams } from 'graphql-relational-schema-transformer';
import { ResourceDoesNotExistError, ResourceCredentialsNotFoundError, exitOnNextTick, $TSContext, $TSObject } from 'amplify-cli-core';

const spinner = ora('');
const category = 'api';
const providerName = 'awscloudformation';

export async function serviceWalkthrough(context: $TSContext, defaultValuesFilename: string, datasourceMetadata: $TSObject) {
  const amplifyMeta = context.amplify.getProjectMeta();

  // Verify that an API exists in the project before proceeding.
  if (amplifyMeta == null || amplifyMeta[category] == null || Object.keys(amplifyMeta[category]).length === 0) {
    const errMessage =
      'You must create an AppSync API in your project before adding a graphql datasource. Please use "amplify api add" to create the API.';
    context.print.error(errMessage);
    await context.usageData.emitError(new ResourceDoesNotExistError(errMessage));
    exitOnNextTick(0);
  }

  // Loop through to find the AppSync API Resource Name
  let appSyncApi: string;
  const apis = Object.keys(amplifyMeta[category]);

  for (let i = 0; i < apis.length; i += 1) {
    if (amplifyMeta[category][apis[i]].service === 'AppSync') {
      appSyncApi = apis[i];
      break;
    }
  }

  // If an AppSync API does not exist, inform the user to create the AppSync API
  if (!appSyncApi) {
    const errMessage =
      'You must create an AppSync API in your project before adding a graphql datasource. Please use "amplify api add" to create the API.';
    context.print.error(errMessage);
    await context.usageData.emitError(new ResourceDoesNotExistError(errMessage));
    exitOnNextTick(0);
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
  const { selectedClusterArn, clusterResourceId } = await selectCluster(context, inputs, AWS);

  // Secret Store Question
  const selectedSecretArn = await getSecretStoreArn(context, inputs, clusterResourceId, AWS);

  // Database Name Question
  const selectedDatabase = await selectDatabase(context, inputs, selectedClusterArn, selectedSecretArn, AWS);

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
async function selectCluster(context: $TSContext, inputs, AWS) {
  const RDS = new AWS.RDS();

  const describeDBClustersResult = await RDS.describeDBClusters().promise();
  const rawClusters = describeDBClustersResult.DBClusters;

  const clusters = new Map();
  const serverlessClusters = rawClusters.filter(cluster => cluster.EngineMode === 'serverless');

  if (serverlessClusters.length === 0) {
    const errMessage = 'No properly configured Aurora Serverless clusters found.';

    context.print.error(errMessage);

    await context.usageData.emitError(new ResourceDoesNotExistError(errMessage));

    exitOnNextTick(0);
  }

  for (const cluster of serverlessClusters) {
    clusters.set(cluster.DBClusterIdentifier, cluster);
  }

  if (clusters.size > 1) {
    const clusterIdentifier = await promptWalkthroughQuestion(inputs, 1, Array.from(clusters.keys()));
    const selectedCluster = clusters.get(clusterIdentifier);

    return {
      selectedClusterArn: selectedCluster.DBClusterArn,
      clusterResourceId: selectedCluster.DbClusterResourceId,
    };
  }

  // Pick first and only value
  const firstCluster = Array.from(clusters.values())[0];

  context.print.info(`${chalk.green('✔')} Only one Cluster was found: '${firstCluster.DBClusterIdentifier}' was automatically selected.`);

  return {
    selectedClusterArn: firstCluster.DBClusterArn,
    clusterResourceId: firstCluster.DbClusterResourceId,
  };
}

/**
 *
 * @param {*} inputs
 * @param {*} clusterResourceId
 */
async function getSecretStoreArn(context: $TSContext, inputs, clusterResourceId, AWS) {
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
  const secretsForCluster = rawSecrets.filter(secret => secret.Name.startsWith(`rds-db-credentials/${clusterResourceId}`));

  if (secretsForCluster.length === 0) {
    const errMessage = 'No RDS access credentials found in the AWS Secrect Manager.';

    context.print.error(errMessage);

    await context.usageData.emitError(new ResourceCredentialsNotFoundError(errMessage));

    exitOnNextTick(0);
  }

  for (const secret of secretsForCluster) {
    secrets.set(secret.Name, secret.ARN);
  }

  let selectedSecretArn;

  if (secrets.size > 1) {
    // Kick off questions flow
    const selectedSecretName = await promptWalkthroughQuestion(inputs, 2, Array.from(secrets.keys()));
    selectedSecretArn = secrets.get(selectedSecretName);
  } else {
    // Pick first and only value
    selectedSecretArn = Array.from(secrets.values())[0];

    context.print.info(`${chalk.green('✔')} Only one Secret was found for the cluster: '${selectedSecretArn}' was automatically selected.`);
  }

  return selectedSecretArn;
}

/**
 *
 * @param {*} inputs
 * @param {*} clusterArn
 * @param {*} secretArn
 */
async function selectDatabase(context: $TSContext, inputs, clusterArn, secretArn, AWS) {
  // Database Name Question
  const DataApi = new AWS.RDSDataService();
  const params = new DataApiParams();
  const databaseList = [];
  params.secretArn = secretArn;
  params.resourceArn = clusterArn;
  params.sql = 'SHOW databases';

  spinner.start('Fetching Aurora Serverless cluster...');

  try {
    const dataApiResult = await DataApi.executeStatement(params).promise();
    const excludedDatabases = ['information_schema', 'performance_schema', 'mysql', 'sys'];

    databaseList.push(...dataApiResult.records.map(record => record[0].stringValue).filter(name => !excludedDatabases.includes(name)));

    spinner.succeed('Fetched Aurora Serverless cluster.');
  } catch (err) {
    spinner.fail(err.message);

    if (err.code === 'BadRequestException' && /Access denied for user/.test(err.message)) {
      const msg =
        `Ensure that '${secretArn}' contains your database credentials. ` +
        'Please note that Aurora Serverless does not support IAM database authentication.';
      context.print.error(msg);
    }
  }

  if (databaseList.length === 0) {
    const errMessage = 'No database found in the selected cluster.';

    context.print.error(errMessage);

    await context.usageData.emitError(new ResourceDoesNotExistError(errMessage));

    exitOnNextTick(0);
  }

  if (databaseList.length > 1) {
    return await promptWalkthroughQuestion(inputs, 3, databaseList);
  }

  context.print.info(`${chalk.green('✔')} Only one Database was found: '${databaseList[0]}' was automatically selected.`);

  return databaseList[0];
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

async function getAwsClient(context: $TSContext, action: string) {
  const providerPlugins = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugins[providerName]);
  return await provider.getConfiguredAWSClient(context, 'aurora-serverless', action);
}
