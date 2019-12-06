const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { DynamoDBModelTransformer } = require('graphql-dynamodb-transformer');
const { ModelAuthTransformer } = require('graphql-auth-transformer');
const { ModelConnectionTransformer } = require('graphql-connection-transformer');
const { SearchableModelTransformer } = require('graphql-elasticsearch-transformer');
const { VersionedModelTransformer } = require('graphql-versioned-transformer');
const { FunctionTransformer } = require('graphql-function-transformer');
const { HttpTransformer } = require('graphql-http-transformer');
const { PredictionsTransformer } = require('graphql-predictions-transformer');
const { KeyTransformer } = require('graphql-key-transformer');
const providerName = require('./constants').ProviderName;
const TransformPackage = require('graphql-transformer-core');
const { hashElement } = require('folder-hash');
const { print } = require('graphql');

const {
  collectDirectivesByTypeNames,
  readTransformerConfiguration,
  writeTransformerConfiguration,
  TRANSFORM_CONFIG_FILE_NAME,
  TRANSFORM_BASE_VERSION,
  CLOUDFORMATION_FILE_NAME,
} = TransformPackage;

const apiCategory = 'api';
const storageCategory = 'storage';
const parametersFileName = 'parameters.json';
const schemaFileName = 'schema.graphql';
const schemaDirName = 'schema';
const ROOT_APPSYNC_S3_KEY = 'amplify-appsync-files';
const s3ServiceName = 'S3';

function warnOnAuth(context, map) {
  const unAuthModelTypes = Object.keys(map).filter(type => !map[type].includes('auth') && map[type].includes('model'));
  if (unAuthModelTypes.length) {
    context.print.warning("\nThe following types do not have '@auth' enabled. Consider using @auth with @model");
    context.print.warning(unAuthModelTypes.map(type => `\t - ${type}`).join('\n'));
    context.print.info('Learn more about @auth here: https://aws-amplify.github.io/docs/cli-toolchain/graphql#auth \n');
  }
}

function getTransformerFactory(context, resourceDir, authConfig) {
  return async (addSearchableTransformer, storageConfig) => {
    const transformerList = [
      // TODO: Removing until further discussion. `getTransformerOptions(project, '@model')`
      new DynamoDBModelTransformer(),
      new VersionedModelTransformer(),
      new FunctionTransformer(),
      new HttpTransformer(),
      new KeyTransformer(),
      new ModelConnectionTransformer(),
      new PredictionsTransformer(storageConfig),
    ];

    if (addSearchableTransformer) {
      transformerList.push(new SearchableModelTransformer());
    }

    const customTransformersConfig = await readTransformerConfiguration(resourceDir);
    const customTransformers = (customTransformersConfig && customTransformersConfig.transformers
      ? customTransformersConfig.transformers
      : []
    )
      .map(transformer => {
        const fileUrlMatch = /^file:\/\/(.*)\s*$/m.exec(transformer);
        const modulePath = fileUrlMatch ? fileUrlMatch[1] : transformer;

        if (!modulePath) {
          throw new Error(`Invalid value specified for transformer: '${transformer}'`);
        }

        // The loading of transformer can happen multiple ways in the following order:
        // - modulePath is an absolute path to an NPM package
        // - modulePath is a package name, then it will be loaded from the project's root's node_modules with createRequireFromPath.
        // - modulePath is a name of a globally installed package
        let importedModule;
        const tempModulePath = modulePath.toString();

        try {
          if (path.isAbsolute(tempModulePath)) {
            // Load it by absolute path
            importedModule = require(modulePath);
          } else {
            const projectRootPath = context.amplify.pathManager.searchProjectRootPath();
            const { createRequireFromPath } = require('module');
            const projectRequire = createRequireFromPath(projectRootPath);

            if (tempModulePath.startsWith('./')) {
              // Lookup 'locally' within project's node_modules with require mechanism
              importedModule = projectRequire(tempModulePath);
            } else {
              const prefixedModuleName = `./${tempModulePath}`;

              try {
                // Lookup 'locally' within project's node_modules with require mechanism
                importedModule = projectRequire(prefixedModuleName);
              } catch (_) {
                // Intentionally left blank to try global
              }

              if (!importedModule) {
                // Lookup in global with require
                importedModule = require(tempModulePath);
              }
            }
          }

          // At this point we've to have an imported module, otherwise module loader, threw an error.
          return importedModule;
        } catch (error) {
          context.print.error(`Unable to import custom transformer module(${modulePath}).`);
          context.print.error(`You may fix this error by editing transformers at ${path.join(resourceDir, TRANSFORM_CONFIG_FILE_NAME)}`);
          throw error;
        }
      })
      .map(imported => {
        const CustomTransformer = imported.default;

        if (typeof CustomTransformer === 'function') {
          return new CustomTransformer();
        } else if (typeof CustomTransformer === 'object') {
          return CustomTransformer;
        }

        throw new Error("Custom Transformers' default export must be a function or an object");
      })
      .filter(customTransformer => customTransformer);

    if (customTransformers.length > 0) {
      transformerList.push(...customTransformers);
    }

    // TODO: Build dependency mechanism into transformers. Auth runs last
    // so any resolvers that need to be protected will already be created.
    transformerList.push(new ModelAuthTransformer({ authConfig }));

    return transformerList;
  };
}
/**
 * @TODO Include a map of versions to keep track
 */
async function transformerVersionCheck(context, resourceDir, cloudBackendDirectory, updatedResources, usedDirectives) {
  const versionChangeMessage =
    'The default behavior for @auth has changed in the latest version of Amplify\nRead here for details: https://aws-amplify.github.io/docs/cli-toolchain/graphql#authorizing-subscriptions';
  const checkVersionExist = config => config && config.Version;

  // this is where we check if there is a prev version of the transformer being used
  // by using the transformer.conf.json file
  const cloudTransformerConfig = await readTransformerConfiguration(cloudBackendDirectory);
  const cloudVersionExist = checkVersionExist(cloudTransformerConfig);

  // check local resource if the question has been answered before
  const localTransformerConfig = await readTransformerConfiguration(resourceDir);
  const localVersionExist = checkVersionExist(localTransformerConfig);

  // if we already asked the confirmation question before at a previous push
  // or during current operations we should not ask again.
  const showPrompt = !(cloudVersionExist || localVersionExist);

  const resources = updatedResources.filter(resource => resource.service === 'AppSync');

  if (showPrompt && usedDirectives.includes('auth') && resources.length > 0) {
    if (context.exeInfo && context.exeInfo.inputParams && context.exeInfo.inputParams.yes) {
      context.print.warning(`\n${versionChangeMessage}\n`);
    } else {
      const response = await inquirer.prompt({
        name: 'transformerConfig',
        type: 'confirm',
        message: `${versionChangeMessage}\nDo you wish to continue?`,
        default: false,
      });
      if (!response.transformerConfig) {
        process.exit(0);
      }
    }
  }

  // Only touch the file if it misses the Version property
  // Always set to the base version, to not to break existing projects when coming
  // from an older version of the CLI.
  if (!localTransformerConfig.Version) {
    localTransformerConfig.Version = TRANSFORM_BASE_VERSION;
    await writeTransformerConfiguration(resourceDir, localTransformerConfig);
  }
}

function apiProjectIsFromOldVersion(pathToProject, resourcesToBeCreated) {
  const resources = resourcesToBeCreated.filter(resource => resource.service === 'AppSync');
  if (!pathToProject || resources.length > 0) {
    return false;
  }
  return fs.existsSync(`${pathToProject}/${CLOUDFORMATION_FILE_NAME}`) && !fs.existsSync(`${pathToProject}/${TRANSFORM_CONFIG_FILE_NAME}`);
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
  const backEndDir = context.amplify.pathManager.getBackendDirPath();
  const flags = context.parameters.options;
  if (flags['no-gql-override']) {
    return;
  }

  let { resourceDir, parameters } = options;
  const { forceCompile } = options;

  // Compilation during the push step
  const { resourcesToBeCreated, resourcesToBeUpdated, allResources } = await context.amplify.getResourceStatus(apiCategory);
  let resources = resourcesToBeCreated.concat(resourcesToBeUpdated);

  // When build folder is missing include the API
  // to be compiled without the backend/api/<api-name>/build
  // cloud formation push will fail even if there is no changes in the GraphQL API
  // https://github.com/aws-amplify/amplify-console/issues/10
  const resourceNeedCompile = allResources
    .filter(r => !resources.includes(r))
    .filter(r => {
      const buildDir = path.normalize(path.join(backEndDir, apiCategory, r.resourceName, 'build'));
      return !fs.existsSync(buildDir);
    });
  resources = resources.concat(resourceNeedCompile);

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
  const isOldApiVersion = apiProjectIsFromOldVersion(previouslyDeployedBackendDir, resourcesToBeCreated);
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
      const migrateMessage =
        `${chalk.bold('The CLI is going to take the following actions during the migration step:')}\n` +
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

  let { authConfig } = options;

  //
  // If we don't have an authConfig from the caller, use it from the
  // already read resources[0], which is an AppSync API.
  //

  if (!authConfig) {
    if (resources[0].output.securityType) {
      // Convert to multi-auth format if needed.
      authConfig = {
        defaultAuthentication: {
          authenticationType: resources[0].output.securityType,
        },
        additionalAuthenticationProviders: [],
      };
    } else {
      ({ authConfig } = resources[0].output);
    }
  }

  // for the predictions directive get storage config
  const s3Resource = s3ResourceAlreadyExists(context);
  const storageConfig = s3Resource ? getBucketName(context, s3Resource, backEndDir) : undefined;

  const buildDir = path.normalize(path.join(resourceDir, 'build'));
  const schemaFilePath = path.normalize(path.join(resourceDir, schemaFileName));
  const schemaDirPath = path.normalize(path.join(resourceDir, schemaDirName));
  let deploymentRootKey = await getPreviousDeploymentRootKey(previouslyDeployedBackendDir);
  if (!deploymentRootKey) {
    const deploymentSubKey = await hashDirectory(resourceDir);
    deploymentRootKey = `${ROOT_APPSYNC_S3_KEY}/${deploymentSubKey}`;
  }
  const projectBucket = options.dryRun ? 'fake-bucket' : getProjectBucket(context);
  const buildParameters = {
    ...parameters,
    S3DeploymentBucket: projectBucket,
    S3DeploymentRootKey: deploymentRootKey,
  };

  fs.ensureDirSync(buildDir);
  // Transformer compiler code
  // const schemaText = await TransformPackage.readProjectSchema(resourceDir);
  const project = await TransformPackage.readProjectConfiguration(resourceDir);

  // Check for common errors
  const directiveMap = collectDirectivesByTypeNames(project.schema);
  warnOnAuth(context, directiveMap.types);

  await transformerVersionCheck(context, resourceDir, previouslyDeployedBackendDir, resourcesToBeUpdated, directiveMap.directives);

  const transformerListFactory = getTransformerFactory(context, resourceDir, authConfig);

  let searchableTransformerFlag = false;

  if (directiveMap.directives.includes('searchable')) {
    searchableTransformerFlag = true;
  }

  const buildConfig = {
    buildParameters,
    projectDirectory: options.dryrun ? false : resourceDir,
    transformersFactory: transformerListFactory,
    transformersFactoryArgs: [searchableTransformerFlag, storageConfig],
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

function getProjectBucket(context) {
  const projectDetails = context.amplify.getProjectDetails();
  const projectBucket = projectDetails.amplifyMeta.providers ? projectDetails.amplifyMeta.providers[providerName].DeploymentBucketName : '';
  return projectBucket;
}

async function hashDirectory(directory) {
  const options = {
    encoding: 'hex',
    folders: {
      exclude: ['build'],
    },
  };

  return hashElement(directory, options).then(result => result.hash);
}

async function getPreviousDeploymentRootKey(previouslyDeployedBackendDir) {
  // this is the function
  let parameters;
  try {
    const parametersPath = path.join(previouslyDeployedBackendDir, `build/${parametersFileName}`);
    const parametersExists = await fs.exists(parametersPath);
    if (parametersExists) {
      const parametersString = await fs.readFile(parametersPath);
      parameters = JSON.parse(parametersString.toString());
    }
    return parameters.S3DeploymentRootKey;
  } catch (err) {
    return undefined;
  }
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

async function getDirectiveDefinitions(context, resourceDir) {
  const transformList = await getTransformerFactory(context, resourceDir)(true);
  return transformList
    .map(transformPluginInst => [transformPluginInst.directive, ...transformPluginInst.typeDefinitions].map(node => print(node)).join('\n'))
    .join('\n');
}
/**
 * Check if storage exists in the project if not return undefined
 */
function s3ResourceAlreadyExists(context) {
  const { amplify } = context;
  try {
    let resourceName;
    const { amplifyMeta } = amplify.getProjectDetails();
    if (amplifyMeta[storageCategory]) {
      const categoryResources = amplifyMeta[storageCategory];
      Object.keys(categoryResources).forEach(resource => {
        if (categoryResources[resource].service === s3ServiceName) {
          resourceName = resource;
        }
      });
    }
    return resourceName;
  } catch (error) {
    if (error.name === 'UndeterminedEnvironmentError') {
      return undefined;
    }
    throw error;
  }
}

function getBucketName(context, s3ResourceName, backEndDir) {
  const { amplify } = context;
  const { amplifyMeta } = amplify.getProjectDetails();
  const stackName = amplifyMeta.providers.awscloudformation.StackName;
  const parametersFilePath = path.join(backEndDir, storageCategory, s3ResourceName, parametersFileName);
  const bucketParameters = context.amplify.readJsonFile(parametersFilePath);
  const bucketName = stackName.startsWith('amplify-')
    ? `${bucketParameters.bucketName}\${hash}-\${env}`
    : `${bucketParameters.bucketName}${s3ResourceName}-\${env}`;
  return { bucketName };
}

module.exports = {
  transformGraphQLSchema,
  getDirectiveDefinitions,
};
