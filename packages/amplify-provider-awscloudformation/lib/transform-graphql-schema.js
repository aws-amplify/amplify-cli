const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const DynamoDBModelTransformer = require('graphql-dynamodb-transformer').default;
const ModelAuthTransformer = require('graphql-auth-transformer').default;
const ModelConnectionTransformer = require('graphql-connection-transformer').default;
const SearchableModelTransformer = require('graphql-elasticsearch-transformer').default;
const VersionedModelTransformer = require('graphql-versioned-transformer').default;
const providerName = require('./constants').ProviderName;
const TransformPackage = require('graphql-transformer-core');

const { collectDirectiveNames } = TransformPackage;

const category = 'api';
const parametersFileName = 'parameters.json';
const schemaFileName = 'schema.graphql';
const schemaDirName = 'schema';

function checkForCommonIssues(usedDirectives, opts) {
  if (usedDirectives.includes('auth') && !opts.isUserPoolEnabled) {
    throw new Error(`You are trying to use the @auth directive without enabling Amazon Cognito user pools for your API.
Run \`amplify update api\` and choose "Amazon Cognito User Pool" as the authorization type for the API.`);
  }
}

function apiProjectIsFromOldVersion(pathToProject) {
  return fs.existsSync(`${pathToProject}/cloudformation-template.json`) && !fs.existsSync(`${pathToProject}/transform.conf.json`);
}

/**
 * API migration happens in a few steps. First we calculate which resources need
 * to remain in the root stack (DDB tables, ES Domains, etc) and write them to
 * transform.conf.json. We then call CF's update stack on the root stack such
 * that only the resources that need to be in the root stack remain there
 * (this deletes resolvers from the schema). We then compile the project with
 * the new implementation and call update stack again.
 * @param {*} context
 * @param {*} resourceDir
 */
async function migrateProject(context, options) {
  const { resourceDir, isCLIMigration } = options;
  const updateAndWaitForStack = options.handleMigration || (() => Promise.resolve('Skipping update'));
  let oldProjectConfig;
  try {
    context.print.info('Migrating your API. This may take a few minutes.');
    const { old } = await TransformPackage.migrateAPIProject({
      projectDirectory: resourceDir,
    });
    oldProjectConfig = old;
    await updateAndWaitForStack({ isCLIMigration });
  } catch (e) {
    await TransformPackage.revertAPIMigration(resourceDir, oldProjectConfig);
    throw e;
  }
  try {
    await transformGraphQLSchema(context, options);
    const result = await updateAndWaitForStack({ isCLIMigration });
    context.print.info('Finished migrating API.');
    return result;
  } catch (e) {
    context.print.error('Reverting API migration.');
    await TransformPackage.revertAPIMigration(resourceDir, oldProjectConfig);
    await updateAndWaitForStack({ isReverting: true, isCLIMigration });
    context.print.error('API successfully reverted.');
    throw e;
  }
}

async function transformGraphQLSchema(context, options) {
  const flags = context.parameters.options;
  if ('gql-override' in flags && !flags['gql-override']) {
    return;
  }

  let { resourceDir, parameters } = options;
  // const { noConfig } = options;
  const { forceCompile } = options;

  // Compilation during the push step
  const {
    resourcesToBeCreated,
    resourcesToBeUpdated,
    allResources,
  } = await context.amplify.getResourceStatus(category);
  let resources = resourcesToBeCreated.concat(resourcesToBeUpdated);
  if (forceCompile) {
    resources = resources.concat(allResources);
  }
  resources = resources.filter(resource => resource.service === 'AppSync');

  if (!resourceDir) {
    // There can only be one appsync resource
    if (resources.length > 0) {
      const resource = resources[0];
      if (resource.providerPlugin !== providerName) {
        return;
      }
      const { category, resourceName } = resource;
      const backEndDir = context.amplify.pathManager.getBackendDirPath();
      resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
    } else {
      // No appsync resource to update/add
      return;
    }
  }

  let currentCloudBackendDir = '';
  if (resources.length > 0) {
    const resource = resources[0];
    if (resource.providerPlugin !== providerName) {
      return;
    }
    const { category, resourceName } = resource;
    const cloudBackendRootDir = context.amplify.pathManager.getCurrentCloudBackendDirPath();
    currentCloudBackendDir = path.normalize(path.join(cloudBackendRootDir, category, resourceName));
  } else {
    // No appsync resource to update/add
    return;
  }

  const parametersFilePath = path.join(resourceDir, parametersFileName);

  if (!parameters && fs.existsSync(parametersFilePath)) {
    try {
      parameters = JSON.parse(fs.readFileSync(parametersFilePath));
    } catch (e) {
      parameters = {};
    }
  }

  const isCLIMigration = options.migrate;
  const isOldApiVersion = apiProjectIsFromOldVersion(currentCloudBackendDir);
  const migrateOptions = {
    ...options,
    resourceDir,
    migrate: false,
    isCLIMigration,
  };
  if (isCLIMigration && isOldApiVersion) {
    return await migrateProject(context, migrateOptions);
  } else if (isOldApiVersion) {
    const { IsOldApiProject } = await inquirer.prompt({
      name: 'IsOldApiProject',
      type: 'confirm',
      message: 'We detected an API that was initialized using an older version of the CLI. Do you want to migrate the API so that it is compatible with the latest version of the CLI?',
      default: true,
    });
    if (!IsOldApiProject) {
      throw new Error('Migration cancelled. Please downgrade to a older version of the Amplify CLI or migrate your API project.');
    }
    return await migrateProject(context, migrateOptions);
  }

  const buildDir = `${resourceDir}/build`;
  const schemaFilePath = `${resourceDir}/${schemaFileName}`;
  const schemaDirPath = `${resourceDir}/${schemaDirName}`;

  fs.ensureDirSync(buildDir);
  // Transformer compiler code
  // const schemaText = await TransformPackage.readProjectSchema(resourceDir);
  const project = await TransformPackage.readProjectConfiguration(resourceDir);

  // Check for common errors
  const usedDirectives = collectDirectiveNames(project.schema);
  checkForCommonIssues(
    usedDirectives,
    { isUserPoolEnabled: Boolean(parameters.AuthCognitoUserPoolId) },
  );

  const transformerList = [
    new DynamoDBModelTransformer(getModelConfig(project)),
    new ModelConnectionTransformer(),
    new VersionedModelTransformer(),
  ];

  if (usedDirectives.includes('searchable')) {
    transformerList.push(new SearchableModelTransformer());
  }

  if (parameters.AuthCognitoUserPoolId) {
    transformerList.push(new ModelAuthTransformer());
  }

  await TransformPackage.buildAPIProject({
    projectDirectory: resourceDir,
    transformers: transformerList,
    rootStackFileName: 'cloudformation-template.json',
  });

  context.print.success(`\nGraphQL schema compiled successfully.\n\nEdit your schema at ${schemaFilePath} or \
place .graphql files in a directory at ${schemaDirPath}`);

  const jsonString = JSON.stringify(parameters, null, 4);

  fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
}

function getModelConfig(project) {
  if (project && project.config && project.config.Model && project.config.Model.BillingMode) {
    return {
      BillingMode: project.config.Model.BillingMode,
    };
  }
  return undefined;
}

module.exports = {
  transformGraphQLSchema,
};
