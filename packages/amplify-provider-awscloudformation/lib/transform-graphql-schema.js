const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const DynamoDBModelTransformer = require('graphql-dynamodb-transformer').default;
const ModelAuthTransformer = require('graphql-auth-transformer').default;
const ModelConnectionTransformer = require('graphql-connection-transformer').default;
const SearchableModelTransformer = require('graphql-elasticsearch-transformer').default;
const VersionedModelTransformer = require('graphql-versioned-transformer').default;
const FunctionTransformer = require('graphql-function-transformer').default;
const HTTPTransformer = require('graphql-http-transformer').default;
const KeyTransformer = require('graphql-key-transformer').default;
const providerName = require('./constants').ProviderName;
const TransformPackage = require('graphql-transformer-core');

const {
  collectDirectivesByTypeNames,
  readTransformerConfiguration,
  writeTransformerConfiguration,
} = TransformPackage;

const category = 'api';
const parametersFileName = 'parameters.json';
const schemaFileName = 'schema.graphql';
const schemaDirName = 'schema';

function failOnInvalidAuthType(usedDirectives, opts) {
  if (usedDirectives.includes('auth') && !opts.isUserPoolEnabled) {
    throw new Error(`You are trying to
use the @auth directive without enabling Amazon Cognito user pools for your API.
Run \`amplify update api\` and choose
"Amazon Cognito User Pool" as the authorization type for the API.`);
  }
}

function warnOnAuth(context, map) {
  const unAuthModelTypes = Object.keys(map).filter(type => (!map[type].includes('auth') && map[type].includes('model')));
  if (unAuthModelTypes.length) {
    context.print.warning('\nThe following types do not have \'@auth\' enabled. Consider using @auth with @model');
    context.print.warning(unAuthModelTypes.map(type => `\t - ${type}`).join('\n'));
    context.print.info('Learn more about @auth here: https://aws-amplify.github.io/docs/cli-toolchain/graphql#auth \n');
  }
}

/**
 * @TODO Include a map of versions to keep track
 */
async function transformerVersionCheck(
  context, resourceDir, cloudBackendDirectory,
  updatedResources, usedDirectives,
) {
  const versionChangeMessage = 'The default behaviour for @auth has changed in the latest version of Amplify\nRead here for details: https://aws-amplify.github.io/docs/cli-toolchain/graphql#authorizing-subscriptions';
  let transformerConfig;
  // this is where we check if there is a prev version of the transformer being used
  // by using the transformer.conf.json file
  try {
    transformerConfig = await readTransformerConfiguration(cloudBackendDirectory);
  } catch (err) {
    // check local resource if the question has been answered before
    transformerConfig = await readTransformerConfiguration(resourceDir);
  }
  const resources = updatedResources.filter(resource => resource.service === 'AppSync');
  if (!transformerConfig.Version && usedDirectives.includes('auth')
  && resources.length > 0) {
    if (context.exeInfo &&
      context.exeInfo.inputParams && context.exeInfo.inputParams.yes) {
      context.print.warning(`\n${versionChangeMessage}\n`);
    } else {
      const response = await inquirer.prompt({
        name: 'transformerConfig',
        type: 'confirm',
        message: `\n${versionChangeMessage} \n Do you wish to continue?`,
        default: false,
      });
      if (!response.transformerConfig) {
        process.exit(0);
      }
    }
  }
  transformerConfig.Version = 4.0;
  await writeTransformerConfiguration(resourceDir, transformerConfig);
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
    try {
      await updateAndWaitForStack({ isReverting: true, isCLIMigration });
    } catch (e) {
      context.print.error('Error reverting intermediate migration stack.');
    }
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
      parameters = context.amplify.readJsonFile(parametersFilePath);
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
  const directiveMap = collectDirectivesByTypeNames(project.schema);
  failOnInvalidAuthType(
    directiveMap.directives,
    { isUserPoolEnabled: Boolean(parameters.AuthCognitoUserPoolId) },
  );
  warnOnAuth(
    context,
    directiveMap.types,
  );

  await transformerVersionCheck(
    context,
    resourceDir,
    previouslyDeployedBackendDir,
    resourcesToBeUpdated,
    directiveMap.directives,
  );

  const authMode = parameters.AuthCognitoUserPoolId ? 'AMAZON_COGNITO_USER_POOLS' : 'API_KEY';
  const transformerList = [
    // TODO: Removing until further discussion. `getTransformerOptions(project, '@model')`
    new DynamoDBModelTransformer(),
    new ModelConnectionTransformer(),
    new VersionedModelTransformer(),
    new FunctionTransformer(),
    new HTTPTransformer(),
    new KeyTransformer(),
    // TODO: Build dependency mechanism into transformers. Auth runs last
    // so any resolvers that need to be protected will already be created.
    new ModelAuthTransformer({ authMode }),
  ];

  if (directiveMap.directives.includes('searchable')) {
    transformerList.push(new SearchableModelTransformer());
  }

  const buildConfig = {
    projectDirectory: options.dryrun ? false : resourceDir,
    transformers: transformerList,
    rootStackFileName: 'cloudformation-template.json',
    currentCloudBackendDirectory: previouslyDeployedBackendDir,
    disableResolverOverrides: options.disableResolverOverrides,
  };
  const transformerOutput = await TransformPackage.buildAPIProject(buildConfig);

  context.print.success(`\nGraphQL schema compiled successfully.\n\nEdit your schema at ${schemaFilePath} or \
place .graphql files in a directory at ${schemaDirPath}`);

  const jsonString = JSON.stringify(parameters, null, 4);

  if (!options.dryRun) {
    fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
  }
  return transformerOutput;
}

// TODO: Remove until further discussion
// function getTransformerOptions(project, transformerName) {
//   if (
//     project &&
//     project.config &&
//     project.config.TransformerOptions &&
//     project.config.TransformerOptions[transformerName]
//   ) {
//     return project.config.TransformerOptions[transformerName];
//   }
//   return undefined;
// }

module.exports = {
  transformGraphQLSchema,
};
