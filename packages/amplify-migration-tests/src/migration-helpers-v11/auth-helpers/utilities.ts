import { addAuthUserPoolOnlyWithOAuth, amplifyPushAuth, getBackendAmplifyMeta, getTeamProviderInfo } from '@aws-amplify/amplify-e2e-core';
import { $TSObject, JSONUtilities } from 'amplify-cli-core';
import * as fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import { createUserPoolOnlyWithOAuthSettings } from './settings';
import { AuthProjectDetails } from './types';

export const getShortId = (): string => {
  const [shortId] = uuid().split('-');

  return shortId;
};

export const getAuthProjectDetails = (projectRoot: string): AuthProjectDetails => {
  const meta = getBackendAmplifyMeta(projectRoot);
  const team = getTeamProviderInfo(projectRoot);
  const authMetaKey = Object.keys(meta.auth)
    .filter((key) => meta.auth[key].service === 'Cognito')
    .map((key) => key)[0];

  const authMeta = meta.auth[authMetaKey];
  // eslint-disable-next-line spellcheck/spell-checker
  const authTeam = _.get(team, ['integtest', 'categories', 'auth', authMetaKey]);
  // eslint-disable-next-line spellcheck/spell-checker
  const providerTeam = _.get(team, ['integtest', 'awscloudformation']);
  const parameters = readResourceParametersJson(projectRoot, 'auth', authMetaKey);

  const result: AuthProjectDetails = {
    authResourceName: authMetaKey,
    parameters: {
      authSelections: parameters.authSelections,
      resourceName: parameters.userPoolName,
    },
    meta: {
      UserPoolId: authMeta.output.UserPoolId,
      UserPoolName: authMeta.output.UserPoolName,
      AppClientID: authMeta.output.AppClientID,
      AppClientSecret: authMeta.output.AppClientSecret,
      AppClientIDWeb: authMeta.output.AppClientIDWeb,
      HostedUIDomain: authMeta.output.HostedUIDomain,
      OAuthMetadata: authMeta.output.OAuthMetadata ? JSON.parse(authMeta.output.OAuthMetadata) : undefined,
    },
    team: {
      userPoolId: authTeam.userPoolId,
      userPoolName: authTeam.userPoolName,
      webClientId: authTeam.webClientId,
      nativeClientId: authTeam.nativeClientId,
      hostedUIProviderCreds: authTeam.hostedUIProviderCreds ? JSON.parse(authTeam.hostedUIProviderCreds) : undefined,
    },
  };

  if (result.parameters.authSelections === 'identityPoolAndUserPool') {
    result.meta = {
      ...result.meta,
      IdentityPoolId: authMeta.output.IdentityPoolId,
      IdentityPoolName: authMeta.output.IdentityPoolName,
      AmazonWebClient: authMeta.output.AmazonWebClient,
      FacebookWebClient: authMeta.output.FacebookWebClient,
      GoogleWebClient: authMeta.output.GoogleWebClient,
    };

    result.team = {
      ...result.team,
      identityPoolId: authMeta.output.IdentityPoolId,
      identityPoolName: authMeta.output.IdentityPoolName,
      allowUnauthenticatedIdentities: parameters.allowUnauthenticatedIdentities,
      authRoleArn: providerTeam.AuthRoleArn,
      authRoleName: providerTeam.AuthRoleName,
      unauthRoleArn: providerTeam.UnauthRoleArn,
      unauthRoleName: providerTeam.UnauthRoleName,
      amazonAppId: authTeam.amazonAppId,
      facebookAppId: authTeam.facebookAppId,
      googleClientId: authTeam.googleClientId,
    };
  }

  return result;
};

export const getOGAuthProjectDetails = (projectRoot: string): AuthProjectDetails => {
  const meta = getBackendAmplifyMeta(projectRoot);
  const team = getTeamProviderInfo(projectRoot);

  const authMetaKey = Object.keys(meta.auth)
    .filter((key) => meta.auth[key].service === 'Cognito')
    .map((key) => key)[0];

  const authMeta = meta.auth[authMetaKey];
  // eslint-disable-next-line spellcheck/spell-checker
  const authTeam = _.get(team, ['integtest', 'categories', 'auth', authMetaKey]);
  const parameters = readResourceParametersJson(projectRoot, 'auth', authMetaKey);

  return {
    authResourceName: authMetaKey,
    parameters: {
      authSelections: parameters.authSelections,
      resourceName: parameters.userPoolName,
    },
    meta: {
      UserPoolId: authMeta.output.UserPoolId,
      UserPoolName: authMeta.output.UserPoolName,
      AppClientID: authMeta.output.AppClientID,
      AppClientSecret: authMeta.output.AppClientSecret,
      AppClientIDWeb: authMeta.output.AppClientIDWeb,
      HostedUIDomain: authMeta.output.HostedUIDomain,
      OAuthMetadata: authMeta.output.OAuthMetadata ? JSON.parse(authMeta.output.OAuthMetadata) : undefined,
      IdentityPoolId: authMeta.output.IdentityPoolId,
      IdentityPoolName: authMeta.output.IdentityPoolName,
    },
    team: {
      userPoolId: authMeta.output.UserPoolId,
      userPoolName: authMeta.output.UserPoolName,
      webClientId: authMeta.output.AppClientIDWeb,
      nativeClientId: authMeta.output.AppClientID,
      hostedUIProviderCreds: authTeam.hostedUIProviderCreds ? JSON.parse(authTeam.hostedUIProviderCreds) : undefined,
    },
  };
};

export const readResourceParametersJson = (projectRoot: string, category: string, resourceName: string): $TSObject => {
  const parametersFilePath = path.join(projectRoot, 'amplify', 'backend', category, resourceName, 'parameters.json');
  const parametersFileBuildPath = path.join(projectRoot, 'amplify', 'backend', category, resourceName, 'build', 'parameters.json');

  if (fs.existsSync(parametersFilePath)) {
    return JSONUtilities.readJson(parametersFilePath);
  }
  if (fs.existsSync(parametersFileBuildPath)) {
    return JSONUtilities.readJson(parametersFileBuildPath);
  }
  throw new Error("parameters.json doesn't exist");
};

/**
 * sets up a project with auth (UserPool only or UserPool & IdentityPool)
 */
export const setupOgProjectWithAuth = async (ogProjectRoot: string, ogProjectSettings: { name: string }): Promise<AuthProjectDetails> => {
  const ogShortId = getShortId();
  console.log(createUserPoolOnlyWithOAuthSettings(ogProjectSettings.name, ogShortId));
  await addAuthUserPoolOnlyWithOAuth(ogProjectRoot, createUserPoolOnlyWithOAuthSettings(ogProjectSettings.name, ogShortId));
  await amplifyPushAuth(ogProjectRoot);
  return getOGAuthProjectDetails(ogProjectRoot);
};
