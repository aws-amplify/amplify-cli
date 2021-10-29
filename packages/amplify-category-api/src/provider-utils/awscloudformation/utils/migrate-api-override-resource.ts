import {
  $TSAny,
  AmplifyCategories,
  JSONUtilities,
  NotInitializedError,
  pathManager,
  ResourceDoesNotExistError,
  stateManager,
} from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as fs from 'fs-extra';
import { ResolverConfig } from 'graphql-transformer-core';
import _ from 'lodash';
import * as path from 'path';
import uuid from 'uuid';
import { AppsyncCLIInputs } from '../service-walkthrough-types/appsync-user-input-types';
import { authConfigToAppSyncAuthType } from './auth-config-to-app-sync-auth-type-bi-di-mapper';
import { resolverConfigToConflictResolution } from './resolver-config-to-conflict-resolution-bi-di-mapper';

type ApiMetaData = {
  resourceName: string;
  authConfig: $TSAny;
  resolverConfig: ResolverConfig;
};
export const migrateResourceToSupportOverride = async (resourceName: string) => {
  printer.debug('Starting Migration Process');
  /**
   * backup resource folder
   * get parameters.json
   * generate and save cliInputs
   * return cliInputs
   *  */
  const projectPath = pathManager.findProjectRoot();
  if (!projectPath) {
    // New project, hence not able to find the amplify dir
    throw new NotInitializedError();
  }
  const apiresourceDirPath = pathManager.getResourceDirectoryPath(undefined, AmplifyCategories.API, resourceName);
  const backupApiResourceFolder = backup(apiresourceDirPath, projectPath, resourceName);

  try {
    const resolverConfig =
      JSONUtilities.readJson<ResolverConfig>(path.join(apiresourceDirPath, 'transformer.conf.json'), { throwIfNotExist: false }) ?? {};
    const authConfig = stateManager.getMeta()[AmplifyCategories.API][resourceName].output.authConfig;
    if (_.isEmpty(authConfig)) {
      throw new ResourceDoesNotExistError(
        `auth configuration not present for ${resourceName}. Try amplify pull to sync your folder structure`,
      );
    }
    const parameters: ApiMetaData = {
      authConfig,
      resolverConfig,
      resourceName,
    };
    // convert parameters.json to cli-inputs.json
    const cliInputs = generateCliInputs(parameters);
    const cliInputsPath = path.join(apiresourceDirPath, 'cli-inputs.json');
    JSONUtilities.writeJson(cliInputsPath, cliInputs);
    printer.debug('Migration is Successful');
  } catch (e) {
    printer.error('There was an error migrating your project.');
    rollback(apiresourceDirPath, backupApiResourceFolder);
    printer.debug('migration operations are rolled back.');
    throw e;
  } finally {
    cleanUp(backupApiResourceFolder);
  }
};

function backup(authresourcePath: string, projectPath: string, resourceName: string) {
  if (fs.existsSync(authresourcePath)) {
    const backupauthResourceDirName = `${resourceName}-BACKUP-${uuid().split('-')[0]}`;
    const backupauthResourceDirPath = path.join(projectPath, backupauthResourceDirName);

    if (fs.existsSync(backupauthResourceDirPath)) {
      const error = new Error(`Backup folder at ${backupauthResourceDirPath} already exists, remove the folder and retry the operation.`);

      error.name = 'BackupFolderAlreadyExist';
      error.stack = undefined;

      throw error;
    }

    fs.copySync(authresourcePath, backupauthResourceDirPath);
    return backupauthResourceDirPath;
  }
}

function rollback(authresourcePath: string, backupauthResourceDirPath: string) {
  if (fs.existsSync(authresourcePath) && fs.existsSync(backupauthResourceDirPath)) {
    fs.removeSync(authresourcePath);
    fs.moveSync(backupauthResourceDirPath, authresourcePath);
  }
}

function cleanUp(authresourcePath: string | undefined) {
  if (!!authresourcePath && fs.existsSync(authresourcePath)) fs.removeSync(authresourcePath);
}

const generateCliInputs = (parameters: ApiMetaData): AppsyncCLIInputs => {
  return {
    version: 1,
    serviceConfiguration: {
      serviceName: 'AppSync',
      defaultAuthType: authConfigToAppSyncAuthType(parameters.authConfig ? parameters.authConfig.defaultAuthentication : undefined),
      additionalAuthTypes:
        parameters.authConfig && parameters.authConfig.additionalAuthenticationProviders
          ? parameters.authConfig.additionalAuthenticationProviders.map(authConfigToAppSyncAuthType)
          : undefined,
      conflictResolution: resolverConfigToConflictResolution(parameters.resolverConfig),
      apiName: parameters.resourceName,
      gqlSchemaPath: path.join(),
    },
  };
};
