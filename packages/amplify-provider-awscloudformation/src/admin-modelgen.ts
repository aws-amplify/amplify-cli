import { $TSAny, $TSContext, pathManager, stateManager } from '@aws-amplify/amplify-cli-core';
import * as fs from 'fs-extra';
import { isDataStoreEnabled } from 'graphql-transformer-core';
import _ from 'lodash';
import * as path from 'path';
import { S3 } from './aws-utils/aws-s3';
import { ProviderName as providerName } from './constants';
import { printer } from '@aws-amplify/amplify-prompts';
import { isAmplifyAdminApp } from './utils/admin-helpers';

/**
 * Generates DataStore Models for Admin UI CMS to consume
 */
export const adminModelgen = async (context: $TSContext, resources: $TSAny[]): Promise<void> => {
  const appSyncResources = resources.filter((resource) => resource.service === 'AppSync');

  if (appSyncResources.length === 0) {
    return;
  }

  const appSyncResource = appSyncResources[0];
  const { resourceName } = appSyncResource;

  const amplifyMeta = stateManager.getMeta();

  const appId = amplifyMeta?.providers?.[providerName]?.AmplifyAppId;

  if (!appId) {
    return;
  }

  const isDSEnabled = await isDataStoreEnabled(path.join(pathManager.getBackendDirPath(), 'api', resourceName));

  if (!isDSEnabled) {
    return;
  }

  const localSchemaPath = path.join(pathManager.getResourceDirectoryPath(undefined, 'api', resourceName), 'schema.graphql');
  // Early return with a warning if the schema file does not exist
  if (!fs.existsSync(localSchemaPath)) {
    const { isAdminApp } = await isAmplifyAdminApp(appId);
    if (isAdminApp) {
      printer.warn(
        `Could not find the GraphQL schema file at "${localSchemaPath}". Amplify Studio's schema editor might not work as intended if you're using multiple schema files.`,
      );
    }
    return;
  }

  // the following is a hack to enable us to upload assets needed by studio CMS to the deployment bucket without
  // calling AmplifyBackend.generateBackendAPIModels.
  // Calling this API introduces a circular dependency because this API in turn executes the CLI to generate codegen assets

  const originalProjectConfig = stateManager.getProjectConfig();
  const relativeTempOutputDir = 'amplify-codegen-temp';
  const absoluteTempOutputDir = path.join(pathManager.findProjectRoot(), relativeTempOutputDir);
  const forceJSCodegenProjectConfig = {
    frontend: 'javascript',
    javascript: {
      framework: 'none',
      config: {
        SourceDir: relativeTempOutputDir,
      },
    },
  };
  const originalStdoutWrite = process.stdout.write;
  let tempStdoutWrite: fs.WriteStream = null;
  try {
    // overwrite project config with config that forces codegen to output js to a temp location
    stateManager.setProjectConfig(undefined, forceJSCodegenProjectConfig);

    // generateModels and generateModelIntrospection print confusing and duplicate output when executing these codegen paths
    // so pipe stdout to a file and then reset it at the end to suppress this output
    await fs.ensureDir(absoluteTempOutputDir);
    const tempLogFilePath = path.join(absoluteTempOutputDir, 'temp-console-log.txt');
    await fs.ensureFile(tempLogFilePath);
    tempStdoutWrite = fs.createWriteStream(tempLogFilePath);
    process.stdout.write = tempStdoutWrite.write.bind(tempStdoutWrite);

    // invokes https://github.com/aws-amplify/amplify-codegen/blob/main/packages/amplify-codegen/src/commands/models.js#L60
    await context.amplify.invokePluginMethod(context, 'codegen', undefined, 'generateModels', [context]);

    // generateModelIntrospection expects --output-dir option to be set
    _.setWith(context, ['parameters', 'options', 'output-dir'], relativeTempOutputDir);

    // invokes https://github.com/aws-amplify/amplify-codegen/blob/main/packages/amplify-codegen/src/commands/model-intropection.js#L8
    await context.amplify.invokePluginMethod(context, 'codegen', undefined, 'generateModelIntrospection', [context]);

    const localSchemaJsPath = path.join(absoluteTempOutputDir, 'models', 'schema.js');
    const localModelIntrospectionPath = path.join(absoluteTempOutputDir, 'model-introspection.json');

    // ==================== DO NOT MODIFY THIS MAP UNLESS YOU ARE 100% SURE OF THE IMPLICATIONS ====================
    // this map represents an implicit interface between the CLI and the Studio CMS frontend
    const s3ApiModelsPrefix = `models/${resourceName}/`;
    const cmsArtifactLocalToS3KeyMap: Record<LocalPath, S3Key> = {
      [localSchemaPath]: `${s3ApiModelsPrefix}schema.graphql`,
      [localSchemaJsPath]: `${s3ApiModelsPrefix}schema.js`,
      [localModelIntrospectionPath]: `${s3ApiModelsPrefix}modelIntrospection.json`,
    };
    // ==================== DO NOT MODIFY THIS MAP UNLESS YOU ARE 100% SURE OF THE IMPLICATIONS ====================

    await uploadCMSArtifacts(await S3.getInstance(context), cmsArtifactLocalToS3KeyMap);
  } finally {
    stateManager.setProjectConfig(undefined, originalProjectConfig);
    process.stdout.write = originalStdoutWrite;
    if (tempStdoutWrite) {
      await new Promise((resolve, reject) => {
        tempStdoutWrite.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve(null);
          }
        });
      });
    }
    await fs.remove(absoluteTempOutputDir);
  }
};

/**
 * Uploads the files specified in uploadMap to the corresponding S3 key
 */
const uploadCMSArtifacts = async (s3Client: S3, uploadMap: Record<LocalPath, S3Key>): Promise<void> => {
  const doNotShowSpinner = false;
  const uploadPromises = Object.entries(uploadMap)
    .map(([localPath, s3Key]) => ({
      Body: fs.createReadStream(localPath),
      Key: s3Key,
    }))
    .map((uploadParams) => s3Client.uploadFile(uploadParams, doNotShowSpinner));
  await Promise.all(uploadPromises);
};

type LocalPath = string;
type S3Key = string;
