import _ from 'lodash';
import { getProjectMeta, getBackendAmplifyMeta, getTeamProviderInfo, getBackendConfig } from 'amplify-e2e-core';
import { ProjectDetails, readRootStack } from '.';

export const expectProjectDetailsMatch = (projectDetails: ProjectDetails, ogProjectDetails: ProjectDetails) => {
  expect(projectDetails.parameters.authSelections).toEqual(ogProjectDetails.parameters.authSelections);

  expect(projectDetails.meta.UserPoolId).toEqual(ogProjectDetails.meta.UserPoolId);
  expect(projectDetails.meta.AppClientID).toEqual(ogProjectDetails.meta.AppClientID);
  expect(projectDetails.meta.AppClientSecret).toEqual(ogProjectDetails.meta.AppClientSecret);
  expect(projectDetails.meta.AppClientIDWeb).toEqual(ogProjectDetails.meta.AppClientIDWeb);
  expect(projectDetails.meta.HostedUIDomain).toEqual(ogProjectDetails.meta.HostedUIDomain);

  if (projectDetails.meta.OAuthMetadata) {
    expect(ogProjectDetails.meta.OAuthMetadata).toBeDefined();

    expect(projectDetails.meta.OAuthMetadata.AllowedOAuthFlows).toEqual(ogProjectDetails.meta.OAuthMetadata.AllowedOAuthFlows);
    expect(projectDetails.meta.OAuthMetadata.AllowedOAuthScopes.sort()).toEqual(
      ogProjectDetails.meta.OAuthMetadata.AllowedOAuthScopes.sort(),
    );
    expect(projectDetails.meta.OAuthMetadata.CallbackURLs).toEqual(ogProjectDetails.meta.OAuthMetadata.CallbackURLs);
    expect(projectDetails.meta.OAuthMetadata.LogoutURLs).toEqual(ogProjectDetails.meta.OAuthMetadata.LogoutURLs);
  }

  expect(projectDetails.team.userPoolId).toEqual(ogProjectDetails.team.userPoolId);
  expect(projectDetails.team.webClientId).toEqual(ogProjectDetails.team.webClientId);
  expect(projectDetails.team.nativeClientId).toEqual(ogProjectDetails.team.nativeClientId);
  expect(projectDetails.team.hostedUIProviderCreds).toMatchObject(ogProjectDetails.team.hostedUIProviderCreds);
};

export const expectLocalAndCloudMetaFilesMatching = (projectRoot: string) => {
  const cloudMeta = getProjectMeta(projectRoot);
  const meta = getBackendAmplifyMeta(projectRoot);

  expect(cloudMeta).toMatchObject(meta);
};

export const expectLocalAndOGMetaFilesOutputMatching = (projectRoot: string, ogProjectRoot: string) => {
  const meta = getBackendAmplifyMeta(projectRoot);
  const ogMeta = getBackendAmplifyMeta(ogProjectRoot);

  const authMeta = Object.keys(meta.auth)
    .filter(key => meta.auth[key].service === 'Cognito')
    .map(key => meta.auth[key])[0];

  const ogAuthMeta = Object.keys(ogMeta.auth)
    .filter(key => ogMeta.auth[key].service === 'Cognito')
    .map(key => ogMeta.auth[key])[0];

  expect(authMeta.output.AppClientID).toEqual(ogAuthMeta.output.AppClientID);
  expect(authMeta.output.AppClientIDWeb).toEqual(ogAuthMeta.output.AppClientIDWeb);
  expect(authMeta.output.AppClientSecret).toEqual(ogAuthMeta.output.AppClientSecret);
  expect(authMeta.output.HostedUIDomain).toEqual(ogAuthMeta.output.HostedUIDomain);
  expect(authMeta.output.UserPoolId).toEqual(ogAuthMeta.output.UserPoolId);
};

export const expectNoAuthInMeta = (projectRoot: string) => {
  const meta = getBackendAmplifyMeta(projectRoot);

  expect(meta.auth).toBeDefined();
  expect(meta.auth).toMatchObject({});
};

export const expectLocalTeamInfoHasNoCategories = (projectRoot: string) => {
  const team = getTeamProviderInfo(projectRoot);

  expect(team.integtest.categories).toBeUndefined();
};

export const expectApiHasCorrectAuthConfig = (projectRoot: string, projectPrefix: string, userPoolId: string) => {
  const meta = getBackendAmplifyMeta(projectRoot);

  const authConfig = meta.api?.auimpup?.output?.authConfig;

  expect(authConfig).toBeDefined();

  expect(authConfig.defaultAuthentication?.authenticationType).toEqual('AMAZON_COGNITO_USER_POOLS');
  expect(authConfig.defaultAuthentication?.userPoolConfig?.userPoolId).toEqual(userPoolId);

  const rootStack = readRootStack(projectRoot);

  expect(rootStack.Resources?.apiauimpup?.Properties?.Parameters?.AuthCognitoUserPoolId).toEqual(userPoolId);
};

export const expectLocalAndPulledBackendConfigMatching = (projectRoot: string, projectRootPull: string) => {
  const backendConfig = getBackendConfig(projectRoot);
  const backendConfigPull = getBackendConfig(projectRootPull);

  expect(backendConfig).toMatchObject(backendConfigPull);
};
