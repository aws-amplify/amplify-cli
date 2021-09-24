import fs from 'fs-extra';
import path from 'path';
import importGlobal from 'import-global';
import { print } from 'graphql';
import importFrom from 'import-from';
import { TransformerPluginProvider, AppSyncAuthConfiguration } from '@aws-amplify/graphql-transformer-interfaces';
import {
  getAppSyncServiceExtraDirectives,
  GraphQLTransform,
  collectDirectivesByTypeNames,
  collectDirectives,
  TransformerProjectConfig,
} from '@aws-amplify/graphql-transformer-core';
import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
import { FunctionTransformer } from '@aws-amplify/graphql-function-transformer';
import { HttpTransformer } from '@aws-amplify/graphql-http-transformer';
import { PredictionsTransformer } from '@aws-amplify/graphql-predictions-transformer';
import { IndexTransformer, PrimaryKeyTransformer } from '@aws-amplify/graphql-index-transformer';
import {
  BelongsToTransformer,
  HasManyTransformer,
  HasOneTransformer,
  ManyToManyTransformer,
} from '@aws-amplify/graphql-relational-transformer';
import { SearchableModelTransformer } from '@aws-amplify/graphql-searchable-transformer';
import { ProviderName as providerName } from '../constants';
import { hashDirectory } from '../upload-appsync-files';
import { showACM, writeDeploymentToDisk } from './utils';
import { loadProject as readTransformerConfiguration } from './transform-config';
import { loadProject } from 'graphql-transformer-core';
import { Template } from '@aws-amplify/graphql-transformer-core/lib/config/project-config';
import { AmplifyCLIFeatureFlagAdapter } from '../utils/amplify-cli-feature-flag-adapter';
import { isAmplifyAdminApp } from '../utils/admin-helpers';
import { JSONUtilities, stateManager, $TSContext } from 'amplify-cli-core';
import { showSandboxModePrompts, getSandboxModeEnvNameFromDirectiveSet } from '../utils/sandbox-mode-helpers';

const API_CATEGORY = 'api';
const STORAGE_CATEGORY = 'storage';
const PARAMETERS_FILENAME = 'parameters.json';
const SCHEMA_FILENAME = 'schema.graphql';
const SCHEMA_DIR_NAME = 'schema';
const ROOT_APPSYNC_S3_KEY = 'amplify-appsync-files';
const S3_SERVICE_NAME = 'S3';

const TRANSFORM_CONFIG_FILE_NAME = `transform.conf.json`;

function warnOnAuth(context, map) {
  const a: boolean = true;
  const unAuthModelTypes = Object.keys(map).filter(type => !map[type].includes('auth') && map[type].includes('model'));
  if (unAuthModelTypes.length) {
    context.print.warning("\nThe following types do not have '@auth' enabled. Consider using @auth with @model");
    context.print.warning(unAuthModelTypes.map(type => `\t - ${type}`).join('\n'));
    context.print.info('Learn more about @auth here: https://docs.amplify.aws/cli/graphql-transformer/auth\n');
  }
}

function getTransformerFactory(
  context: $TSContext,
  resourceDir: string,
): (options: TransformerFactoryArgs) => Promise<TransformerPluginProvider[]> {
  return async (options?: TransformerFactoryArgs) => {
    const modelTransformer = new ModelTransformer();
    const indexTransformer = new IndexTransformer();
    const hasOneTransformer = new HasOneTransformer();
    const transformerList: TransformerPluginProvider[] = [
      modelTransformer,
      new FunctionTransformer(),
      new HttpTransformer(),
      new PredictionsTransformer(options?.storageConfig),
      new PrimaryKeyTransformer(),
      indexTransformer,
      new BelongsToTransformer(),
      new HasManyTransformer(),
      hasOneTransformer,
      new ManyToManyTransformer(modelTransformer, indexTransformer, hasOneTransformer),
      // TODO: initialize transformer plugins
    ];

    if (options?.addSearchableTransformer) {
      transformerList.push(new SearchableModelTransformer());
    }

    const customTransformersConfig = await readTransformerConfiguration(resourceDir);
    const customTransformers = (
      customTransformersConfig && customTransformersConfig.transformers ? customTransformersConfig.transformers : []
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
            const projectNodeModules = path.join(projectRootPath, 'node_modules');

            try {
              importedModule = importFrom(projectNodeModules, modulePath);
            } catch (_) {
              // Intentionally left blank to try global
            }

            // Try global package install
            if (!importedModule) {
              importedModule = importGlobal(modulePath);
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
          // Todo: Use a shim to ensure that it adheres to TransformerProvider interface. For now throw error
          // return CustomTransformer;
          throw new Error("Custom Transformers' should implement TransformerProvider interface");
        }

        throw new Error("Custom Transformers' default export must be a function or an object");
      })
      .filter(customTransformer => customTransformer);

    if (customTransformers.length > 0) {
      transformerList.push(...customTransformers);
    }

    // TODO: Build dependency mechanism into transformers. Auth runs last
    // so any resolvers that need to be protected will already be created.

    let amplifyAdminEnabled: boolean = false;
    let adminUserPoolID: string;
    try {
      const amplifyMeta = stateManager.getMeta();
      const appId = amplifyMeta?.providers?.[providerName]?.AmplifyAppId;
      const res = await isAmplifyAdminApp(appId);
      amplifyAdminEnabled = res.isAdminApp;
      adminUserPoolID = res.userPoolID;
    } catch (err) {
      console.info('App not deployed yet.');
    }
    transformerList.push(new AuthTransformer({ authConfig: options?.authConfig, addAwsIamAuthInOutputSchema: false, adminUserPoolID }));

    return transformerList;
  };
}

export async function transformGraphQLSchema(context, options) {
  const backEndDir = context.amplify.pathManager.getBackendDirPath();
  const flags = context.parameters.options;
  if (flags['no-gql-override']) {
    return;
  }

  let { resourceDir, parameters } = options;
  const { forceCompile } = options;

  // Compilation during the push step
  const { resourcesToBeCreated, resourcesToBeUpdated, allResources } = await context.amplify.getResourceStatus(API_CATEGORY);
  let resources = resourcesToBeCreated.concat(resourcesToBeUpdated);

  // When build folder is missing include the API
  // to be compiled without the backend/api/<api-name>/build
  // cloud formation push will fail even if there is no changes in the GraphQL API
  // https://github.com/aws-amplify/amplify-console/issues/10
  const resourceNeedCompile = allResources
    .filter(r => !resources.includes(r))
    .filter(r => {
      const buildDir = path.normalize(path.join(backEndDir, API_CATEGORY, r.resourceName, 'build'));
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

  const parametersFilePath = path.join(resourceDir, PARAMETERS_FILENAME);

  if (!parameters && fs.existsSync(parametersFilePath)) {
    try {
      parameters = context.amplify.readJsonFile(parametersFilePath);
    } catch (e) {
      parameters = {};
    }
  }

  let { authConfig }: { authConfig: AppSyncAuthConfiguration } = options;

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
  const schemaFilePath = path.normalize(path.join(resourceDir, SCHEMA_FILENAME));
  const schemaDirPath = path.normalize(path.join(resourceDir, SCHEMA_DIR_NAME));
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

  // If it is a dry run, don't create the build folder as it could make a follow-up command
  // to not to trigger a build, hence a corrupt deployment.
  if (!options.dryRun) {
    fs.ensureDirSync(buildDir);
  }

  const project = await loadProject(resourceDir);

  if (flags['acm']) {
    showACM(project.schema, flags['acm']);
    return;
  }

  const lastDeployedProjectConfig = fs.existsSync(previouslyDeployedBackendDir)
    ? await loadProject(previouslyDeployedBackendDir)
    : undefined;

  // Check for common errors
  const directiveMap = collectDirectivesByTypeNames(project.schema);
  warnOnAuth(context, directiveMap.types);

  const transformerListFactory = getTransformerFactory(context, resourceDir);

  const { envName } = context.amplify._getEnvInfo();
  const sandboxModeEnv = getSandboxModeEnvNameFromDirectiveSet(collectDirectives(project.schema));
  const sandboxModeEnabled = envName === sandboxModeEnv;

  if (sandboxModeEnabled && options.promptApiKeyCreation) {
    const apiKeyConfig = await showSandboxModePrompts(context);
    if (apiKeyConfig) {
      authConfig.additionalAuthenticationProviders.push(apiKeyConfig);
    }
  }

  let searchableTransformerFlag = false;

  if (directiveMap.directives.includes('searchable')) {
    searchableTransformerFlag = true;
  }

  const buildConfig: ProjectOptions<TransformerFactoryArgs> = {
    ...options,
    buildParameters,
    projectDirectory: resourceDir,
    transformersFactory: transformerListFactory,
    transformersFactoryArgs: { addSearchableTransformer: searchableTransformerFlag, storageConfig, authConfig },
    rootStackFileName: 'cloudformation-template.json',
    currentCloudBackendDirectory: previouslyDeployedBackendDir,
    minify: options.minify,
    projectConfig: project,
    lastDeployedProjectConfig,
    authConfig,
    sandboxModeEnabled,
  };

  let transformerOutput;
  let authSchemaErrors = false;
  do {
    try {
    transformerOutput = await buildAPIProject(buildConfig);
    authSchemaErrors = false;
  } catch (err) {
    authSchemaErrors = true;
    if (err.message === `@auth directive with 'iam' provider found, but the project has no IAM authentication provider configured.`) {
      authConfig.additionalAuthenticationProviders.push(await addGraphQLAuthRequirement(context, 'AWS_IAM'));
    } else if (!context?.parameters?.options?.yes) {
      if (err.message === `@auth directive with 'userPools' provider found, but the project has no Cognito User Pools authentication provider configured.`) {
        authConfig.additionalAuthenticationProviders.push(await addGraphQLAuthRequirement(context, 'AMAZON_COGNITO_USER_POOLS'));
      } else if (err.message === `@auth directive with 'oidc' provider found, but the project has no OPENID_CONNECT authentication provider configured.`) {
        authConfig.additionalAuthenticationProviders.push(await addGraphQLAuthRequirement(context, 'OPENID_CONNECT'));
      } else if (err.message === `@auth directive with 'apiKey' provider found, but the project has no API Key authentication provider configured.`) {
        authConfig.additionalAuthenticationProviders.push(await addGraphQLAuthRequirement(context, 'AWS_KEY'));
      } else {
        throw err;
      }
    } else {
      throw err;
    }
  }
  } while (authSchemaErrors);
  context.print.success(`GraphQL schema compiled successfully.\n\nEdit your schema at ${schemaFilePath} or \
place .graphql files in a directory at ${schemaDirPath}`);

  if (!options.dryRun) {
    JSONUtilities.writeJson(parametersFilePath, parameters);
  }

  return transformerOutput;
}

async function addGraphQLAuthRequirement(context, authType) {
  return await context.amplify.invokePluginMethod(context, 'api', undefined, 'addGraphQLAuthorizationMode', [
    context,
    {
      authType: authType,
      printLeadText: true,
      authSettings: undefined,
    },
  ]);
}

function getProjectBucket(context) {
  const projectDetails = context.amplify.getProjectDetails();
  const projectBucket = projectDetails.amplifyMeta.providers ? projectDetails.amplifyMeta.providers[providerName].DeploymentBucketName : '';
  return projectBucket;
}

async function getPreviousDeploymentRootKey(previouslyDeployedBackendDir) {
  // this is the function
  let parameters;
  try {
    const parametersPath = path.join(previouslyDeployedBackendDir, `build/${PARAMETERS_FILENAME}`);
    const parametersExists = fs.existsSync(parametersPath);
    if (parametersExists) {
      const parametersString = await fs.readFile(parametersPath);
      parameters = JSON.parse(parametersString.toString());
    }
    return parameters.S3DeploymentRootKey;
  } catch (err) {
    return undefined;
  }
}

export async function getDirectiveDefinitions(context: $TSContext, resourceDir: string) {
  const transformList = await getTransformerFactory(context, resourceDir)({ addSearchableTransformer: true, authConfig: {} });
  const appSynDirectives = getAppSyncServiceExtraDirectives();
  const transformDirectives = transformList
    .map(transformPluginInst => [transformPluginInst.directive, ...transformPluginInst.typeDefinitions].map(node => print(node)).join('\n'))
    .join('\n');

  return [appSynDirectives, transformDirectives].join('\n');
}
/**
 * Check if storage exists in the project if not return undefined
 */
function s3ResourceAlreadyExists(context) {
  const { amplify } = context;
  try {
    let resourceName;
    const { amplifyMeta } = amplify.getProjectDetails();
    if (amplifyMeta[STORAGE_CATEGORY]) {
      const categoryResources = amplifyMeta[STORAGE_CATEGORY];
      Object.keys(categoryResources).forEach(resource => {
        if (categoryResources[resource].service === S3_SERVICE_NAME) {
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
  const parametersFilePath = path.join(backEndDir, STORAGE_CATEGORY, s3ResourceName, PARAMETERS_FILENAME);
  const bucketParameters = context.amplify.readJsonFile(parametersFilePath);
  const bucketName = stackName.startsWith('amplify-')
    ? `${bucketParameters.bucketName}\${hash}-\${env}`
    : `${bucketParameters.bucketName}${s3ResourceName}-\${env}`;
  return { bucketName };
}

type TransformerFactoryArgs = {
  addSearchableTransformer: boolean;
  authConfig: any;
  storageConfig?: any;
};
export type ProjectOptions<T> = {
  buildParameters: {
    S3DeploymentBucket: string;
    S3DeploymentRootKey: string;
  };
  projectDirectory?: string;
  transformersFactory: (options: T) => Promise<TransformerPluginProvider[]>;
  transformersFactoryArgs: T;
  rootStackFileName: 'cloudformation-template.json';
  currentCloudBackendDirectory: string;
  minify: boolean;
  lastDeployedProjectConfig?: TransformerProjectConfig;
  projectConfig: TransformerProjectConfig;
  dryRun?: boolean;
  authConfig?: AppSyncAuthConfiguration;
  stacks: Record<string, Template>;
  sandboxModeEnabled?: boolean;
};

export async function buildAPIProject(opts: ProjectOptions<TransformerFactoryArgs>) {
  const builtProject = await _buildProject(opts);

  if (opts.projectDirectory && !opts.dryRun) {
    await writeDeploymentToDisk(
      builtProject,
      path.join(opts.projectDirectory, 'build'),
      opts.rootStackFileName,
      opts.buildParameters,
      opts.minify,
    );
    // Todo: Move sanity check to its own package. Run sanity check
    // await Sanity.check(lastBuildPath, thisBuildPath, opts.rootStackFileName);
  }

  // TODO: update local env on api compile
  // await _updateCurrentMeta(opts);

  return builtProject;
}

async function _buildProject(opts: ProjectOptions<TransformerFactoryArgs>) {
  const userProjectConfig = opts.projectConfig;
  const stackMapping = userProjectConfig.config.StackMapping;
  // Create the transformer instances, we've to make sure we're not reusing them within the same CLI command
  // because the StackMapping feature already builds the project once.
  const transformers = await opts.transformersFactory(opts.transformersFactoryArgs);
  const transform = new GraphQLTransform({
    transformers,
    stackMapping,
    transformConfig: userProjectConfig.config,
    authConfig: opts.authConfig,
    buildParameters: opts.buildParameters,
    stacks: opts.projectConfig.stacks || {},
    featureFlags: new AmplifyCLIFeatureFlagAdapter(),
    sandboxModeEnabled: opts.sandboxModeEnabled,
  });
  return transform.transform(userProjectConfig.schema.toString());
}
