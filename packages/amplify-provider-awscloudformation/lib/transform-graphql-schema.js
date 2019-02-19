const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
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

function apiProjectIsFromOldVersion(pathToProject, resourcesToBeCreated) {
  const resources = resourcesToBeCreated.filter(resource => resource.service === 'AppSync');
  if (!pathToProject || resources.length > 0) {
    return false;
  }
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
  const { resourceDir, isCLIMigration, cloudBackendDirectory } = options;
  const updateAndWaitForStack = options.handleMigration || (() => Promise.resolve('Skipping update'));
  let oldProjectConfig;
  let oldCloudBackend;
  try {
    context.print.info('\nMigrating your API. This may take a few minutes.');
    const { project, cloudBackend } = await TransformPackage.migrateAPIProject({
      projectDirectory: resourceDir,
      cloudBackendDirectory,
    });
    oldProjectConfig = project;
    oldCloudBackend = cloudBackend;
    await updateAndWaitForStack({ isCLIMigration });
  } catch (e) {
    await TransformPackage.revertAPIMigration(resourceDir, oldProjectConfig);
    throw e;
  }
  try {
    // After the intermediate update, we need the transform function
    // to look at this directory since we did not overwrite the currentCloudBackend with the build
    options.cloudBackendDirectory = resourceDir;
    await transformGraphQLSchema(context, options);
    const result = await updateAndWaitForStack({ isCLIMigration });
    context.print.info('\nFinished migrating API.');
    return result;
  } catch (e) {
    context.print.error('Reverting API migration.');
    await TransformPackage.revertAPIMigration(resourceDir, oldCloudBackend);
    await updateAndWaitForStack({ isReverting: true, isCLIMigration });
    await TransformPackage.revertAPIMigration(resourceDir, oldProjectConfig);
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

  let previouslyDeployedBackendDir = options.cloudBackendDirectory;
  if (!previouslyDeployedBackendDir) {
    if (resources.length > 0) {
      const resource = resources[0];
      if (resource.providerPlugin !== providerName) {
        return;
      }
      const { category, resourceName } = resource;
      const cloudBackendRootDir = context.amplify.pathManager.getCurrentCloudBackendDirPath();
      /* eslint-disable */
      previouslyDeployedBackendDir = path.normalize(path.join(cloudBackendRootDir, category, resourceName));
      /* eslint-enable */
    }
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
  const isOldApiVersion = apiProjectIsFromOldVersion(
    previouslyDeployedBackendDir,
    resourcesToBeCreated,
  );
  const migrateOptions = {
    ...options,
    resourceDir,
    migrate: false,
    isCLIMigration,
    cloudBackendDirectory: previouslyDeployedBackendDir,
  };
  if (isCLIMigration && isOldApiVersion) {
    return await migrateProject(context, migrateOptions);
  } else if (isOldApiVersion) {
    let IsOldApiProject;

    if (context.exeInfo && context.exeInfo.inputParams && context.exeInfo.inputParams.yes) {
      IsOldApiProject = context.exeInfo.inputParams.yes;
    } else {
      const migrateMessage = `${chalk.bold('The CLI is going to take the following actions during the migration step:')}\n` +
      '\n1. If you have a GraphQL API, we will update the corresponding Cloudformation stack to support larger annotated schemas and custom resolvers.\n' +
      'In this process, we will be making Cloudformation API calls to update your GraphQL API Cloudformation stack. This operation will result in deletion of your AppSync resolvers and then the creation of new ones and for a brief while your AppSync API will be unavailable until the migration finishes\n' +
      '\n2. We will be updating your local Cloudformation files present inside the ‘amplify/‘ directory of your app project, for the GraphQL API service\n' +
      '\n3. If for any reason the migration fails, the CLI will rollback your cloud and local changes and you can take a look at https://aws-amplify.github.io/docs/cli/migrate?sdk=js for manually migrating your project so that it’s compatible with the latest version of the CLI\n' +
      '\n4. ALL THE ABOVE MENTIONED OPERATIONS WILL NOT DELETE ANY DATA FROM ANY OF YOUR DATA STORES\n' +
      `\n${chalk.bold('Before the migration, please be aware of the following things:')}\n` +
      '\n1. Make sure to have an internet connection through the migration process\n' +
      '\n2. Make sure to not exit/terminate the migration process (by interrupting it explicitly in the middle of migration), as this will lead to inconsistency within your project\n' +
      '\n3. Make sure to take a backup of your entire project (including the amplify related config files)\n' +
      '\nDo you want to continue?\n';
      ({ IsOldApiProject } = await inquirer.prompt({
        name: 'IsOldApiProject',
        type: 'confirm',
        message: migrateMessage,
        default: true,
      }));
    }
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
