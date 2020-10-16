import * as path from 'path';
import { v4 as uuid } from 'uuid';
import _ from 'lodash';
import { $TSObject, JSONUtilities } from 'amplify-cli-core';
import { getBackendAmplifyMeta, getTeamProviderInfo } from 'amplify-e2e-core';
import { ProjectDetails } from '.';

export const getShortId = (): string => {
  const [shortId] = uuid().split('-');

  return shortId;
};

export const getProjectDetails = (projectRoot: string): ProjectDetails => {
  const meta = getBackendAmplifyMeta(projectRoot);
  const team = getTeamProviderInfo(projectRoot);

  const authMetaKey = Object.keys(meta.auth)
    .filter(key => meta.auth[key].service === 'Cognito')
    .map(key => key)[0];

  const authMeta = meta.auth[authMetaKey];
  const authTeam = _.get(team, ['integtest', 'categories', 'auth', authMetaKey]);
  const parameters = readAuthParametersJson(projectRoot, authMetaKey);

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
    },
    team: {
      userPoolId: authTeam.userPoolId,
      userPoolName: authTeam.userPoolName,
      webClientId: authTeam.webClientId,
      nativeClientId: authTeam.nativeClientId,
      hostedUIProviderCreds: authTeam.hostedUIProviderCreds ? JSON.parse(authTeam.hostedUIProviderCreds) : undefined,
    },
  };
};

export const getOGProjectDetails = (projectRoot: string): ProjectDetails => {
  const meta = getBackendAmplifyMeta(projectRoot);
  const team = getTeamProviderInfo(projectRoot);

  const authMetaKey = Object.keys(meta.auth)
    .filter(key => meta.auth[key].service === 'Cognito')
    .map(key => key)[0];

  const authMeta = meta.auth[authMetaKey];
  const authTeam = _.get(team, ['integtest', 'categories', 'auth', authMetaKey]);
  const parameters = readAuthParametersJson(projectRoot, authMetaKey);

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

export const readApiParametersJson = (projectRoot: string, projectPrefix: string): $TSObject => {
  const parametersFilePath = path.join(projectRoot, 'amplify', 'backend', 'api', projectPrefix, 'parameters.json');
  const parameters = JSONUtilities.readJson(parametersFilePath);

  return parameters;
};

export const readAuthParametersJson = (projectRoot: string, resourceName: string): $TSObject => {
  const parametersFilePath = path.join(projectRoot, 'amplify', 'backend', 'auth', resourceName, 'parameters.json');
  const parameters = JSONUtilities.readJson(parametersFilePath);

  return parameters;
};

export const readRootStack = (projectRoot: string): $TSObject => {
  const rootStackFilePath = path.join(projectRoot, 'amplify', 'backend', 'awscloudformation', 'nested-cloudformation-stack.yml');
  const rootStack = JSONUtilities.readJson(rootStackFilePath);

  return rootStack;
};
