import {
  getProjectMeta,
  getUserPool,
  checkIfBucketExists,
  getFunction,
  getAppSyncApi,
  describeCloudFormationStack,
  getUserPoolClients,
} from '@aws-amplify/amplify-e2e-core';
import { getProjectOutputs } from './projectOutputs';
import { getAppSyncDataSource, getIdentityPool, getResourceDetails } from './sdk_calls';
import { removeProperties } from '.';
import { $TSAny } from '@aws-amplify/amplify-cli-core';
import assert from 'node:assert';

export async function assertUserPool(gen1Meta: $TSAny, gen1Region: string) {
  const { UserPoolId: gen1UserPoolId } = Object.keys(gen1Meta.auth).map((key) => gen1Meta.auth[key])[0].output;
  const cloudUserPool = await getUserPool(gen1UserPoolId, gen1Region);
  expect(cloudUserPool.UserPool).toBeDefined();
  return { gen1UserPoolId };
}

export async function assertUserPoolClients(gen1Meta: $TSAny, gen1Region: string) {
  const {
    UserPoolId: userPoolId,
    AppClientIDWeb: appClientIdWeb,
    AppClientID: appClientId,
  } = Object.keys(gen1Meta.auth).map((key) => gen1Meta.auth[key])[0].output;
  const gen1ClientIds = [appClientIdWeb, appClientId];
  const clients = await getUserPoolClients(userPoolId, gen1ClientIds, gen1Region);
  expect(clients).toHaveLength(2);
  return { gen1ClientIds };
}

export async function assertIdentityPool(gen1Meta: $TSAny, gen1Region: string) {
  const { IdentityPoolId: gen1IdentityPoolId } = Object.keys(gen1Meta.auth).map((key) => gen1Meta.auth[key])[0].output;
  const cloudIdentityPool = await getIdentityPool(gen1IdentityPoolId, gen1Region);
  expect(cloudIdentityPool).toBeDefined();
  return { gen1IdentityPoolId };
}

async function assertFunction(gen1Meta: $TSAny, gen1Region: string) {
  const { Arn: gen1FunctionArn, Name: gen1FunctionName } = Object.keys(gen1Meta.function).map((key) => gen1Meta.function[key])[0].output;
  expect(gen1FunctionArn).toBeDefined();
  expect(gen1FunctionName).toBeDefined();
  const cloudFunction = await getFunction(gen1FunctionName, gen1Region);
  expect(cloudFunction.Configuration?.FunctionArn).toEqual(gen1FunctionArn);
  return { gen1FunctionName };
}

export async function assertStorage(gen1Meta: $TSAny, gen1Region: string) {
  const { BucketName: gen1BucketName } = Object.keys(gen1Meta.storage).map((key) => gen1Meta.storage[key])[0].output;
  expect(gen1BucketName).toBeDefined();
  const bucketExists = await checkIfBucketExists(gen1BucketName, gen1Region);
  expect(bucketExists).toMatchObject({});
  return { gen1BucketName };
}

async function assertAPI(gen1Meta: $TSAny, gen1Region: string) {
  const {
    GraphQLAPIIdOutput: gen1GraphqlApiId,
    GraphQLAPIEndpointOutput,
    GraphQLAPIKeyOutput,
  } = Object.keys(gen1Meta.api).map((key) => gen1Meta.api[key])[0].output;
  const { graphqlApi } = await getAppSyncApi(gen1GraphqlApiId, gen1Region);

  expect(gen1GraphqlApiId).toBeDefined();
  expect(GraphQLAPIEndpointOutput).toBeDefined();
  expect(GraphQLAPIKeyOutput).toBeDefined();

  expect(graphqlApi).toBeDefined();
  expect(graphqlApi?.apiId).toEqual(gen1GraphqlApiId);
  return { gen1GraphqlApiId };
}

async function assertUserPoolGroups(gen1Meta: $TSAny) {
  const { userPoolGroups } = gen1Meta.auth;
  expect(userPoolGroups.service).toEqual('Cognito-UserPool-Groups');
  expect(userPoolGroups.providerPlugin).toEqual('awscloudformation');
  expect(userPoolGroups.dependsOn.length).toBe(1);
  expect(userPoolGroups.dependsOn[0].category).toBe('auth');
  expect(userPoolGroups.dependsOn[0].attributes.length).toBe(4);
  expect(userPoolGroups.dependsOn[0].attributes).toContain('UserPoolId');
  expect(userPoolGroups.dependsOn[0].attributes).toContain('AppClientIDWeb');
  expect(userPoolGroups.dependsOn[0].attributes).toContain('AppClientID');
  expect(userPoolGroups.dependsOn[0].attributes).toContain('IdentityPoolId');
}

export async function assertDefaultGen1Setup(projRoot: string) {
  const gen1Meta = getProjectMeta(projRoot);
  const gen1StackName = gen1Meta.providers.awscloudformation.StackName;
  const gen1Region = gen1Meta.providers.awscloudformation.Region;
  const { gen1UserPoolId } = await assertUserPool(gen1Meta, gen1Region);
  const { gen1FunctionName } = await assertFunction(gen1Meta, gen1Region);
  assert.doesNotMatch(gen1FunctionName, /PostConfirmation/);
  const { gen1BucketName } = await assertStorage(gen1Meta, gen1Region);
  const { gen1GraphqlApiId } = await assertAPI(gen1Meta, gen1Region);
  const { gen1IdentityPoolId } = await assertIdentityPool(gen1Meta, gen1Region);
  const { gen1ClientIds } = await assertUserPoolClients(gen1Meta, gen1Region);
  return {
    gen1StackName,
    gen1UserPoolId,
    gen1ClientIds,
    gen1IdentityPoolId,
    gen1FunctionName,
    gen1BucketName,
    gen1GraphqlApiId,
    gen1Region,
  };
}

export async function assertAuthWithMaxOptionsGen1Setup(projRoot: string) {
  const gen1Meta = getProjectMeta(projRoot);
  const gen1Region = gen1Meta.providers.awscloudformation.Region;
  const { gen1UserPoolId } = await assertUserPool(gen1Meta, gen1Region);
  const { gen1FunctionName } = await assertFunction(gen1Meta, gen1Region);
  assert.match(gen1FunctionName, /PostConfirmation/);
  const { gen1IdentityPoolId } = await assertIdentityPool(gen1Meta, gen1Region);
  const { gen1ClientIds } = await assertUserPoolClients(gen1Meta, gen1Region);
  await assertUserPoolGroups(gen1Meta);

  return { gen1UserPoolId, gen1ClientIds, gen1IdentityPoolId, gen1FunctionName, gen1Region };
}

export async function assertStorageWithMaxOptionsGen1Setup(projRoot: string) {
  const gen1Meta = getProjectMeta(projRoot);
  const gen1Region = gen1Meta.providers.awscloudformation.Region;
  const { gen1BucketName } = await assertStorage(gen1Meta, gen1Region);
  const { gen1UserPoolId } = await assertUserPool(gen1Meta, gen1Region);
  const { gen1FunctionName } = await assertFunction(gen1Meta, gen1Region);
  assert.match(gen1FunctionName, /S3Trigger/);
  const { gen1ClientIds } = await assertUserPoolClients(gen1Meta, gen1Region);
  const { gen1IdentityPoolId } = await assertIdentityPool(gen1Meta, gen1Region);

  return { gen1UserPoolId, gen1ClientIds, gen1BucketName, gen1IdentityPoolId, gen1Region };
}

async function assertUserPoolResource(projRoot: string, gen1UserPoolId: string, gen1Region: string) {
  const gen1Resource = await getResourceDetails('AWS::Cognito::UserPool', gen1UserPoolId, gen1Region);
  removeProperties(gen1Resource, ['ProviderURL', 'ProviderName', 'UserPoolId', 'Arn', 'LambdaConfig.PostConfirmation']);
  // TODO: remove below line after EmailMessage, EmailSubject, SmsMessage, SmsVerificationMessage, EmailVerificationMessage, EmailVerificationSubject, AccountRecoverySetting inconsistency is fixed
  removeProperties(gen1Resource, [
    'UserPoolTags',
    'VerificationMessageTemplate.EmailMessage',
    'VerificationMessageTemplate.EmailSubject',
    'EmailVerificationSubject',
    'AccountRecoverySetting',
    'EmailVerificationMessage',
  ]);
  const gen2Meta = getProjectOutputs(projRoot);
  const gen2UserPoolId = gen2Meta.auth.user_pool_id;
  const gen2Region = gen2Meta.auth.aws_region;
  const gen2Resource = await getResourceDetails('AWS::Cognito::UserPool', gen2UserPoolId, gen2Region);
  if (gen1Resource.LambdaConfig.PostConfirmation) assert(gen2Resource.LambdaConfig.PostConfirmation);
  removeProperties(gen2Resource, ['ProviderURL', 'ProviderName', 'UserPoolId', 'Arn', 'LambdaConfig.PostConfirmation']);
  // TODO: remove below line after EmailMessage, EmailSubject, SmsMessage, SmsVerificationMessage, EmailVerificationMessage, EmailVerificationSubject, AccountRecoverySetting inconsistency is fixed
  removeProperties(gen2Resource, [
    'UserPoolTags',
    'VerificationMessageTemplate.EmailMessage',
    'VerificationMessageTemplate.SmsMessage',
    'VerificationMessageTemplate.EmailSubject',
    'SmsVerificationMessage',
    'EmailVerificationSubject',
    'AccountRecoverySetting',
    'EmailVerificationMessage',
  ]);
  expect(gen2Resource).toEqual(gen1Resource);
}

async function assertUserPoolClientsResource(projRoot: string, gen1UserPoolId: string, gen1ClientIds: $TSAny[], gen1Region: string) {
  const gen1Resource = await getResourceDetails('AWS::Cognito::UserPoolClient', `${gen1UserPoolId}|${gen1ClientIds[1]}`, gen1Region);
  removeProperties(gen1Resource, ['Name', 'ClientName', 'UserPoolId', 'ClientId']);
  // TODO: remove below line after all the inconsistencies are fixed
  removeProperties(gen1Resource, [
    'CallbackURLs',
    'AllowedOAuthScopes',
    'TokenValidityUnits',
    'AllowedOAuthFlowsUserPoolClient',
    'SupportedIdentityProviders',
    'AllowedOAuthFlows',
    'ExplicitAuthFlows',
  ]);
  const gen2Meta = getProjectOutputs(projRoot);
  const gen2ClientId = gen2Meta.auth.user_pool_client_id;
  const gen2UserPoolId = gen2Meta.auth.user_pool_id;
  const gen2Region = gen2Meta.auth.aws_region;
  const gen2Resource = await getResourceDetails('AWS::Cognito::UserPoolClient', `${gen2UserPoolId}|${gen2ClientId}`, gen2Region);
  removeProperties(gen2Resource, ['Name', 'ClientName', 'UserPoolId', 'ClientId']);
  // TODO: remove below line after all the inconsistencies are fixed
  removeProperties(gen2Resource, [
    'CallbackURLs',
    'AllowedOAuthScopes',
    'TokenValidityUnits',
    'AllowedOAuthFlowsUserPoolClient',
    'SupportedIdentityProviders',
    'AllowedOAuthFlows',
    'ExplicitAuthFlows',
    'PreventUserExistenceErrors',
  ]);
  expect(gen2Resource).toEqual(gen1Resource);
}

async function assertIdentityPoolResource(projRoot: string, gen1IdentityPoolId: string, gen1Region: string) {
  const gen1Resource = await getResourceDetails('AWS::Cognito::IdentityPool', gen1IdentityPoolId, gen1Region);
  removeProperties(gen1Resource, ['CognitoIdentityProviders', 'Id', 'IdentityPoolName', 'IdentityPoolTags', 'Name']);
  // TODO: remove below line after SupportedLoginProviders inconsistency is fixed
  removeProperties(gen1Resource, ['SupportedLoginProviders']);
  const gen2Meta = getProjectOutputs(projRoot);
  const gen2IdentityPoolId = gen2Meta.auth.identity_pool_id;
  const gen2Region = gen2Meta.auth.aws_region;
  const gen2Resource = await getResourceDetails('AWS::Cognito::IdentityPool', gen2IdentityPoolId, gen2Region);
  removeProperties(gen2Resource, ['CognitoIdentityProviders', 'Id', 'IdentityPoolName', 'IdentityPoolTags', 'Name']);
  // TODO: remove below line after SupportedLoginProviders inconsistency is fixed
  removeProperties(gen2Resource, ['SupportedLoginProviders']);
  expect(gen2Resource).toEqual(gen1Resource);
}

export async function assertAuthResource(
  projRoot: string,
  gen1UserPoolId: string,
  gen1ClientIds: $TSAny[],
  gen1IdentityPoolId: string,
  gen1Region: string,
) {
  await assertUserPoolResource(projRoot, gen1UserPoolId, gen1Region);
  await assertUserPoolClientsResource(projRoot, gen1UserPoolId, gen1ClientIds, gen1Region);
  await assertIdentityPoolResource(projRoot, gen1IdentityPoolId, gen1Region);
}

export async function assertStorageResource(projRoot: string, gen1BucketName: string, gen1Region: string) {
  const gen1Resource = await getResourceDetails('AWS::S3::Bucket', gen1BucketName, gen1Region);
  removeProperties(gen1Resource, [
    'DualStackDomainName',
    'DomainName',
    'BucketName',
    'Arn',
    'RegionalDomainName',
    'Tags',
    'WebsiteURL',
    'NotificationConfiguration.LambdaConfigurations[0].Function',
    'NotificationConfiguration.LambdaConfigurations[1].Function',
  ]);
  // TODO: remove below line after CorsConfiguration.CorsRules[0].Id inconsistency is fixed
  removeProperties(gen1Resource, ['CorsConfiguration.CorsRules[0].Id']);

  const gen2Meta = getProjectOutputs(projRoot);
  const gen2BucketName = gen2Meta.storage.bucket_name;
  const gen2Region = gen2Meta.storage.aws_region;
  const gen2Resource = await getResourceDetails('AWS::S3::Bucket', gen2BucketName, gen2Region);
  if (gen1Resource.NotificationConfiguration) {
    assert(gen2Resource.NotificationConfiguration.LambdaConfigurations[0].Function);
    assert(gen2Resource.NotificationConfiguration.LambdaConfigurations[1].Function);
  }
  removeProperties(gen2Resource, [
    'DualStackDomainName',
    'DomainName',
    'BucketName',
    'Arn',
    'RegionalDomainName',
    'Tags',
    'WebsiteURL',
    'NotificationConfiguration.LambdaConfigurations[0].Function',
    'NotificationConfiguration.LambdaConfigurations[1].Function',
  ]);

  expect(gen2Resource).toEqual(gen1Resource);
}

export async function assertFunctionResource(projRoot: string, gen2StackName: string, gen1FunctionName: string, gen1Region: string) {
  const gen1Resource = await getResourceDetails('AWS::Lambda::Function', gen1FunctionName, gen1Region);
  removeProperties(gen1Resource, ['Arn', 'FunctionName', 'LoggingConfig.LogGroup', 'Role']);
  // TODO: remove below line after Tags inconsistency is fixed
  removeProperties(gen1Resource, ['Tags']);

  const gen2Meta = getProjectOutputs(projRoot);
  const gen2Region = gen2Meta.auth.aws_region;
  const outputs = (await describeCloudFormationStack(gen2StackName, gen2Region)).Outputs;
  const gen2FunctionName = JSON.parse(outputs?.find((output) => output.OutputKey === 'definedFunctions')?.OutputValue ?? '[]')[0];
  const gen2Resource = await getResourceDetails('AWS::Lambda::Function', gen2FunctionName, gen2Region);
  assert(gen2Resource.FunctionName);
  removeProperties(gen2Resource, ['Arn', 'FunctionName', 'LoggingConfig.LogGroup', 'Role']);
  // TODO: remove below line after Environment.Variables.AMPLIFY_SSM_ENV_CONFIG, Tags inconsistency is fixed
  removeProperties(gen2Resource, ['Environment.Variables.AMPLIFY_SSM_ENV_CONFIG', 'Tags']);

  expect(gen2Resource).toEqual(gen1Resource);
}

export async function assertDataResource(projRoot: string, gen2StackName: string, gen1GraphqlApiId: string, gen1Region: string) {
  const gen1Resource = await getAppSyncApi(gen1GraphqlApiId, gen1Region);
  const gen1DataSource = (await getAppSyncDataSource(gen1GraphqlApiId, 'TodoTable', gen1Region)) as Record<string, unknown>;
  removeProperties(gen1DataSource, ['dataSourceArn', 'serviceRoleArn']);
  removeProperties(gen1Resource.graphqlApi as Record<string, unknown>, ['name', 'apiId', 'arn', 'uris', 'tags', 'dns']);
  // TODO: remove below line after authenticationType inconsistency is fixed
  removeProperties(gen1Resource.graphqlApi as Record<string, unknown>, ['authenticationType']);

  const gen2Meta = getProjectOutputs(projRoot);
  const gen2Region = gen2Meta.data.aws_region;
  const outputs = (await describeCloudFormationStack(gen2StackName, gen2Region)).Outputs;
  const gen2GraphqlApiId = outputs?.find((output) => output.OutputKey === 'awsAppsyncApiId')?.OutputValue ?? '';
  const gen2Resource = await getAppSyncApi(gen2GraphqlApiId, gen2Region);
  const gen2DataSource = (await getAppSyncDataSource(gen2GraphqlApiId, 'TodoTable', gen1Region)) as Record<string, unknown>;
  removeProperties(gen2DataSource, ['dataSourceArn', 'serviceRoleArn']);
  removeProperties(gen2Resource.graphqlApi as Record<string, unknown>, [
    'name',
    'apiId',
    'arn',
    'uris',
    'tags',
    'additionalAuthenticationProviders',
    'dns',
  ]);
  // TODO: remove below line after authenticationType, userPoolConfig inconsistency is fixed
  removeProperties(gen2Resource.graphqlApi as Record<string, undefined>, ['authenticationType', 'userPoolConfig']);

  expect(gen2DataSource).toEqual(gen1DataSource);
  expect(gen2Resource).toEqual(gen2Resource);
}
