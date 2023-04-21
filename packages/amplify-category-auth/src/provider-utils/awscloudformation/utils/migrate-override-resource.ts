import {
  $TSObject,
  AmplifyCategories,
  projectNotInitializedError,
  AmplifyError,
  JSONUtilities,
  pathManager,
} from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
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

/**
 * migrates resources to support override feature
 */
export const migrateResourceToSupportOverride = async (resourceName: string): Promise<void> => {
  printer.debug('Starting Migration Process');
  /**
   * backup resource folder
   * get parameters.json
   * generate and save cliInputs
   * return cliInputs
   *  */
  const projectPath = pathManager.findProjectRoot();
  if (!projectPath) {
    throw projectNotInitializedError();
  }
  const authResourceDirPath = pathManager.getResourceDirectoryPath(undefined, AmplifyCategories.AUTH, resourceName);
  const userPoolGroupResourceDirPath = pathManager.getResourceDirectoryPath(undefined, AmplifyCategories.AUTH, 'userPoolGroups');
  const backupAuthResourceFolder = backup(authResourceDirPath, projectPath, resourceName);
  const backupUserPoolGroupResourceFolder = backup(userPoolGroupResourceDirPath, projectPath, 'userPoolGroups');

  try {
    const parameters = JSONUtilities.readJson<$TSObject>(path.join(authResourceDirPath, 'parameters.json'), { throwIfNotExist: true });
    fs.emptyDirSync(authResourceDirPath);
    // remove UserPool Resource
    if (parameters?.userPoolGroupList?.length > 0) {
      fs.unlinkSync(path.join(userPoolGroupResourceDirPath, 'template.json'));
      fs.unlinkSync(path.join(userPoolGroupResourceDirPath, 'parameters.json'));
    }

    // convert parameters.json to cli-inputs.json
    const cliInputs = mapParametersJsonToCliInputs(parameters!);
    const cliInputsPath = path.join(authResourceDirPath, 'cli-inputs.json');
    JSONUtilities.writeJson(cliInputsPath, cliInputs);
    printer.debug('Migration is Successful');
  } catch (e) {
    rollback(authResourceDirPath, backupAuthResourceFolder!);
    rollback(userPoolGroupResourceDirPath, backupUserPoolGroupResourceFolder!);
    throw new AmplifyError(
      'MigrationError',
      {
        message: `There was an error migrating your project: ${(e as Error).message}`,
        details: `Migration operations are rolled back.`,
      },
      e as Error,
    );
  } finally {
    cleanUp(backupAuthResourceFolder);
    cleanUp(backupUserPoolGroupResourceFolder);
  }
};

const backup = (authResourcePath: string, projectPath: string, resourceName: string): string | undefined => {
  if (fs.existsSync(authResourcePath)) {
    const backupAuthResourceDirName = `${resourceName}-BACKUP-${uuid().split('-')[0]}`;
    const backupAuthResourceDirPath = path.join(projectPath, backupAuthResourceDirName);

    if (fs.existsSync(backupAuthResourceDirPath)) {
      throw new AmplifyError('MigrationError', {
        message: `Backup folder for ${resourceName} already exists.`,
        resolution: `Delete the backup folder and try again.`,
      });
    }

    fs.copySync(authResourcePath, backupAuthResourceDirPath);
    return backupAuthResourceDirPath;
  }

  return undefined;
};

const rollback = (authResourcePath: string, backupAuthResourceDirPath: string): void => {
  if (fs.existsSync(authResourcePath) && fs.existsSync(backupAuthResourceDirPath)) {
    fs.removeSync(authResourcePath);
    fs.moveSync(backupAuthResourceDirPath, authResourcePath);
  }
};

const cleanUp = (authResourcePath: string | undefined): void => {
  if (!!authResourcePath && fs.existsSync(authResourcePath)) fs.removeSync(authResourcePath);
};

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
  const filteredCliInputs = _.pickBy(cliInputs, (v) => v !== undefined) as CognitoConfiguration;

  return {
    version: '1',
    cognitoConfig: filteredCliInputs,
  };
};
