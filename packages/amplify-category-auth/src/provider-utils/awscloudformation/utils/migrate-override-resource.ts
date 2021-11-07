import { $TSObject, AmplifyCategories, JSONUtilities, NotInitializedError, pathManager } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import * as path from 'path';
import uuid from 'uuid';
import * as fs from 'fs-extra';
import _ from 'lodash';
import {
  CognitoCLIInputs,
  CognitoConfiguration,
  MfaResult,
  ServiceQuestionsBaseResult,
  OAuthResult,
  SocialProviderResult,
  IdentityPoolResult,
  PasswordRecoveryResult,
  AdminQueriesResult,
  PasswordPolicyResult,
} from '../service-walkthrough-types/awsCognito-user-input-types';

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
  const authresourceDirPath = pathManager.getResourceDirectoryPath(undefined, AmplifyCategories.AUTH, resourceName);
  const userPoolGroupResourceDirPath = pathManager.getResourceDirectoryPath(undefined, AmplifyCategories.AUTH, 'userPoolGroups');
  const backupAuthResourceFolder = backup(authresourceDirPath, projectPath, resourceName);
  const backupUserPoolGroupResourceFolder = backup(userPoolGroupResourceDirPath, projectPath, 'userPoolGroups');

  try {
    const parameters = JSONUtilities.readJson<$TSObject>(path.join(authresourceDirPath, 'parameters.json'), { throwIfNotExist: true });
    fs.emptyDirSync(authresourceDirPath);
    // remomve UserPool Resource
    if (parameters?.userPoolGroupList?.length > 0) {
      fs.unlinkSync(path.join(userPoolGroupResourceDirPath, 'template.json'));
      fs.unlinkSync(path.join(userPoolGroupResourceDirPath, 'parameters.json'));
    }

    // convert parameters.json to cli-inputs.json
    const cliInputs = mapParametersJsonToCliInputs(parameters!);
    const cliInputsPath = path.join(authresourceDirPath, 'cli-inputs.json');
    JSONUtilities.writeJson(cliInputsPath, cliInputs);
    printer.debug('Migration is Successful');
  } catch (e) {
    printer.error('There was an error migrating your project.');
    rollback(authresourceDirPath, backupAuthResourceFolder!);
    rollback(userPoolGroupResourceDirPath, backupUserPoolGroupResourceFolder!);
    printer.info('migration operations are rolled back.');
    throw e;
  } finally {
    cleanUp(backupAuthResourceFolder);
    cleanUp(backupUserPoolGroupResourceFolder);
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

const mapParametersJsonToCliInputs = (parameters: $TSObject): CognitoCLIInputs => {
  const baseResult: ServiceQuestionsBaseResult = {
    authSelections: parameters.authSelections,
    requiredAttributes: parameters.requiredAttributes,
    resourceName: parameters.resourceName,
    serviceName: parameters.serviceName,
    useDefault: parameters.useDefault,
    userpoolClientReadAttributes: parameters.userpoolClientReadAttributes,
    userpoolClientWriteAttributes: parameters.userpoolClientWriteAttributes,
    aliasAttributes: parameters.aliasAttributes,
    resourceNameTruncated: parameters.resourceNameTruncated,
    sharedId: parameters.sharedId,
    updateFlow: parameters.updateFlow,
    userPoolGroupList: parameters.userPoolGroupList,
    userPoolGroups: parameters.userPoolGroups,
    userPoolName: parameters.userPoolName,
    usernameAttributes: parameters.usernameAttributes,
    usernameCaseSensitive: parameters.usernameCaseSensitive,
    userpoolClientRefreshTokenValidity: parameters.userpoolClientRefreshTokenValidity,
    userpoolClientSetAttributes: parameters.userpoolClientSetAttributes,
    verificationBucketName: parameters.verificationBucketName,
    userpoolClientGenerateSecret: parameters.userpoolClientGenerateSecret,
    userpoolClientLambdaRole: parameters.userpoolClientLambdaRole,
  };

  const oAuthResult: OAuthResult = {
    hostedUI: parameters.hostedUI,
    hostedUIDomainName: parameters.hostedUIDomainName,
    hostedUIProviderMeta: parameters.hostedUIProviderMeta,
    oAuthMetadata: parameters.oAuthMetadata,
  };

  const socialProviderResult: SocialProviderResult = {
    authProvidersUserPool: parameters.authProvidersUserPool,
  };

  const identityPoolResult: IdentityPoolResult = {
    thirdPartyAuth: parameters.thirdPartyAuth,
    identityPoolName: parameters.identityPoolName,
    allowUnauthenticatedIdentities: parameters.allowUnauthenticatedIdentities,
    authProviders: parameters.authProviders,
    googleClientId: parameters.googleClientId,
    googleIos: parameters.googleIos,
    googleAndroid: parameters.googleAndroid,
    facebookAppId: parameters.facebookAppId,
    amazonAppId: parameters.amazonAppId,
    appleAppId: parameters.appleAppId,
    selectedParties: parameters.selectedParties,
    audiences: parameters.audiences,
  };

  const passwordRecoveryResult: PasswordRecoveryResult = {
    emailVerificationMessage: parameters.emailVerificationMessage,
    emailVerificationSubject: parameters.emailVerificationSubject,
    smsVerificationMessage: parameters.smsVerificationMessage,
    autoVerifiedAttributes: parameters.autoVerifiedAttributes,
  };

  const mfaResult: MfaResult = {
    mfaConfiguration: parameters.mfaConfiguration,
    mfaTypes: parameters.mfaTypes,
    smsAuthenticationMessage: parameters.smsAuthenticationMessage,
  };

  const adminQueriesResult: AdminQueriesResult = {
    adminQueries: parameters.adminQueries,
    adminQueryGroup: parameters.adminQueryGroup,
  };

  const passwordPolicyResult: PasswordPolicyResult = {
    passwordPolicyCharacters: parameters.passwordPolicyCharacters,
    passwordPolicyMinLength: parameters.passwordPolicyMinLength,
  };

  const cliInputs: CognitoConfiguration = {
    ...baseResult,
    ...passwordPolicyResult,
    ...adminQueriesResult,
    ...mfaResult,
    ...passwordRecoveryResult,
    ...oAuthResult,
    ...socialProviderResult,
    ...identityPoolResult,
  };

  if (parameters.triggers) {
    cliInputs.triggers = JSON.parse(parameters.triggers);
  }

  // removing undefined values
  const filteredCliInputs = _.pickBy(cliInputs, v => v !== undefined) as CognitoConfiguration;

  return {
    version: '1',
    cognitoConfig: filteredCliInputs,
  };
};
