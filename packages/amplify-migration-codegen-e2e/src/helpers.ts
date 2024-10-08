import {
  deleteProject as deleteGen1Project,
  deleteProjectDir,
  initJSProjectWithProfile,
  addAuthWithDefault,
  amplifyPush,
  getProjectMeta,
  getUserPool,
  npmInstall,
  getNpxPath,
  nspawn as spawn,
  addS3WithGuestAccess,
  checkIfBucketExists,
  addFunction,
  functionBuild,
  getFunction,
  addApiWithoutSchema,
  updateApiSchema,
  getAppSyncApi,
  amplifyPushForce,
  describeCloudFormationStack,
} from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import { $TSAny } from '@aws-amplify/amplify-cli-core';
import path from 'node:path';
import { CloudControlClient, GetResourceCommand } from '@aws-sdk/client-cloudcontrol';
import { AppSyncClient, GetDataSourceCommand } from '@aws-sdk/client-appsync';
import { unset } from 'lodash';
import { createHash } from 'crypto';
import { userInfo } from 'os';

type AppId = string;
type ProjectName = string;
type BranchName = string;
type SandboxName = string;

type BackendIdentifier =
  | {
      namespace: Readonly<AppId>;
      name: Readonly<BranchName>;
      type: Readonly<'branch'>;
      hash?: Readonly<string>;
    }
  | {
      namespace: Readonly<ProjectName>;
      name: Readonly<SandboxName>;
      type: Readonly<'sandbox'>;
      hash?: Readonly<string>;
    };

const STACK_NAME_LENGTH_LIMIT = 128;
const AMPLIFY_PREFIX = 'amplify';
const HASH_LENGTH = 10;
const NUM_DASHES = 4;
const pushTimeoutMS = 1000 * 60 * 20; // 20 minutes;

function toStackName(backendId: BackendIdentifier): string {
  const hash = getHash(backendId);

  // only take the first 50 chars here to make sure there is room in the stack name for the namespace as well
  const name = sanitizeChars(backendId.name).slice(0, 50);

  const namespaceMaxLength =
    STACK_NAME_LENGTH_LIMIT - AMPLIFY_PREFIX.length - backendId.type.length - name.length - NUM_DASHES - HASH_LENGTH;

  const namespace = sanitizeChars(backendId.namespace).slice(0, namespaceMaxLength - 1);

  return ['amplify', namespace, name, backendId.type, hash].join('-');
}

const getHash = (backendId: BackendIdentifier): string =>
  backendId.hash ??
  // md5 would be sufficient here because this hash does not need to be cryptographically secure, but this ensures that we don't get unnecessarily flagged by some security scanner
  createHash('sha512').update(backendId.namespace).update(backendId.name).digest('hex').slice(0, HASH_LENGTH);

/**
 * Remove all non-alphanumeric characters from the input string
 */
const sanitizeChars = (str: string): string => {
  return str.replace(/[^A-Za-z0-9]/g, '');
};

export async function copyFunctionFile(projRoot: string, gen1FunctionName: string): Promise<void> {
  const sourcePath = path.join(
    projRoot,
    '.amplify',
    'migration',
    'amplify',
    'backend',
    'function',
    gen1FunctionName.split('-')[0],
    'src',
    'index.js',
  );
  const destinationPath = path.join(projRoot, 'amplify', 'function', gen1FunctionName.split('-')[0], 'handler.ts');
  const content = await fs.readFile(sourcePath, 'utf8');

  // Replace the first occurrence of 'event' with 'event: any'
  const modifiedContent = content.replace(/(exports\.handler\s*=\s*async\s*\(\s*)event(\s*\))/, '$1event: any$2');

  await fs.writeFile(destinationPath, modifiedContent, 'utf8');
}

export async function copyGen1Schema(projRoot: string): Promise<void> {
  const gen1SchemaPath = path.join(projRoot, '.amplify', 'migration', 'amplify', 'backend', 'api', 'codegentest', 'schema.graphql');
  const gen1Schema = await fs.readFile(gen1SchemaPath, 'utf-8');
  const dataResourcePath = path.join(projRoot, 'amplify', 'data', 'resource.ts');
  const dataResourceContent = await fs.readFile(dataResourcePath, 'utf-8');
  const backendPath = path.join(projRoot, 'amplify', 'backend.ts');
  let backendContent = await fs.readFile(backendPath, 'utf-8');

  const schemaRegex = /"TODO: Add your existing graphql schema here"/;
  const updatedContent = dataResourceContent.replace(schemaRegex, `\`${gen1Schema.trim()}\``);

  const errorRegex = /throw new Error\("TODO: Add Gen 1 GraphQL schema"\);?\s*/;
  const finalContent = updatedContent.replace(errorRegex, '');

  await fs.writeFile(dataResourcePath, finalContent, 'utf-8');

  const linesToAdd = `
  const todoTable = backend.data.resources.cfnResources.additionalCfnResources['Todo'];
  todoTable.addOverride('Properties.sseSpecification', { sseEnabled: false });
  `;

  backendContent += linesToAdd;
  await fs.writeFile(backendPath, backendContent, 'utf-8');
}

async function setEnableGen2MigrationFeatureFlag(projectRoot: string): Promise<void> {
  const cliJsonPath = path.join(projectRoot, 'amplify', 'cli.json');
  const cliJson = await fs.readJSON(cliJsonPath);
  if (!cliJson.features) {
    cliJson.features = {};
  }
  if (!cliJson.features.graphqltransformer) {
    cliJson.features.graphqltransformer = {};
  }
  cliJson.features.graphqltransformer.enablegen2migration = true;
  await fs.writeJSON(cliJsonPath, cliJson, { spaces: 2 });
}

async function updatePackageJsonDependency(cwd: string, dependencyName: string, version: string): Promise<void> {
  const packageJsonPath = path.join(cwd, 'package.json');
  const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
  const packageJson = JSON.parse(packageJsonContent);

  packageJson.devDependencies = packageJson.devDependencies || {};
  packageJson.devDependencies[dependencyName] = version;

  const updatedContent = JSON.stringify(packageJson, null, 2);
  await fs.writeFile(packageJsonPath, updatedContent, 'utf-8');
}

async function getAppSyncDataSource(apiId: string, dataSourceName: string, region: string) {
  const client = new AppSyncClient({ region });
  const command = new GetDataSourceCommand({
    apiId: apiId,
    name: dataSourceName,
  });
  const response = await client.send(command);
  return response.dataSource;
}

async function getResourceDetails(typeName: string, identifier: string, region: string) {
  const client = new CloudControlClient({ region });
  const command = new GetResourceCommand({
    TypeName: typeName,
    Identifier: identifier,
  });
  const response = await client.send(command);
  return JSON.parse(response.ResourceDescription.Properties);
}

export async function runGen2SandboxCommand(cwd: string) {
  await updatePackageJsonDependency(cwd, '@aws-amplify/backend', '0.0.0-test-20241003180022');
  npmInstall(cwd);
  return spawn(getNpxPath(), ['ampx', 'sandbox', '--once'], {
    cwd,
    stripColors: true,
    noOutputTimeout: pushTimeoutMS,
    env: { ...process.env, npm_config_user_agent: 'npm' },
  }).runAsync();
}

export function runCodegenCommand(cwd: string) {
  return spawn(getNpxPath(), ['@aws-amplify/migrate', 'to-gen-2', 'generate-code'], {
    cwd,
    stripColors: true,
    noOutputTimeout: pushTimeoutMS,
    env: { ...process.env, npm_config_user_agent: 'npm' },
  }).runAsync();
}

function deleteGen2Sandbox(cwd: string) {
  return spawn(getNpxPath(), ['ampx', 'sandbox', 'delete'], {
    cwd,
    stripColors: true,
    noOutputTimeout: pushTimeoutMS,
    env: { ...process.env, npm_config_user_agent: 'npm' },
  })
    .wait("Are you sure you want to delete all the resources in your sandbox environment (This can't be undone)?")
    .sendConfirmYes()
    .wait('Finished deleting.')
    .runAsync();
}

export async function setupAndPushGen1Project(projRoot: string, projectName: string) {
  await initJSProjectWithProfile(projRoot, { name: projectName, disableAmplifyAppCreation: false });
  await addAuthWithDefault(projRoot);
  await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
  await functionBuild(projRoot);
  await addS3WithGuestAccess(projRoot);
  await addApiWithoutSchema(projRoot, { transformerVersion: 2 });
  await updateApiSchema(projRoot, projectName, 'simple_model.graphql');
  await amplifyPush(projRoot);
  await setEnableGen2MigrationFeatureFlag(projRoot);
  await amplifyPushForce(projRoot);
}

export async function assertGen1Setup(projRoot: string) {
  const gen1Meta = getProjectMeta(projRoot);
  const gen1Region = gen1Meta.providers.awscloudformation.Region;
  const { UserPoolId: gen1UserPoolId } = Object.keys(gen1Meta.auth).map((key) => gen1Meta.auth[key])[0].output;
  const { Arn: gen1FunctionArn, Name: gen1FunctionName } = Object.keys(gen1Meta.function).map((key) => gen1Meta.function[key])[0].output;
  const { BucketName: gen1BucketName } = Object.keys(gen1Meta.storage).map((key) => gen1Meta.storage[key])[0].output;
  const {
    GraphQLAPIIdOutput: gen1GraphQLAPIId,
    GraphQLAPIEndpointOutput,
    GraphQLAPIKeyOutput,
  } = Object.keys(gen1Meta.api).map((key) => gen1Meta.api[key])[0].output;
  const { graphqlApi } = await getAppSyncApi(gen1GraphQLAPIId, gen1Region);

  expect(gen1Region).toBeDefined();

  const cloudUserPool = await getUserPool(gen1UserPoolId, gen1Region);
  expect(cloudUserPool.UserPool).toBeDefined();

  expect(gen1FunctionArn).toBeDefined();
  expect(gen1FunctionName).toBeDefined();
  const cloudFunction = await getFunction(gen1FunctionName, gen1Region);
  expect(cloudFunction.Configuration?.FunctionArn).toEqual(gen1FunctionArn);

  expect(gen1BucketName).toBeDefined();
  const bucketExists = await checkIfBucketExists(gen1BucketName, gen1Region);
  expect(bucketExists).toMatchObject({});

  expect(gen1GraphQLAPIId).toBeDefined();
  expect(GraphQLAPIEndpointOutput).toBeDefined();
  expect(GraphQLAPIKeyOutput).toBeDefined();

  expect(graphqlApi).toBeDefined();
  expect(graphqlApi?.apiId).toEqual(gen1GraphQLAPIId);
  return { gen1UserPoolId, gen1FunctionName, gen1BucketName, gen1GraphQLAPIId, gen1Region };
}

export async function assertUserPoolResource(projRoot: string, gen1UserPoolId: string, gen1Region: string) {
  const gen1Resource = await getResourceDetails('AWS::Cognito::UserPool', gen1UserPoolId, gen1Region);
  removeProperties(gen1Resource, ['ProviderURL', 'ProviderName', 'UserPoolId', 'Arn']);
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
  removeProperties(gen2Resource, ['ProviderURL', 'ProviderName', 'UserPoolId', 'Arn']);
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

export async function assertStorageResource(projRoot: string, gen1BucketName: string, gen1Region: string) {
  const gen1Resource = await getResourceDetails('AWS::S3::Bucket', gen1BucketName, gen1Region);
  removeProperties(gen1Resource, ['DualStackDomainName', 'DomainName', 'BucketName', 'Arn', 'RegionalDomainName', 'Tags', 'WebsiteURL']);
  // TODO: remove below line after CorsConfiguration.CorsRules[0].Id inconsistency is fixed
  removeProperties(gen1Resource, ['CorsConfiguration.CorsRules[0].Id']);

  const gen2Meta = getProjectOutputs(projRoot);
  const gen2BucketName = gen2Meta.storage.bucket_name;
  const gen2Region = gen2Meta.storage.aws_region;
  const gen2Resource = await getResourceDetails('AWS::S3::Bucket', gen2BucketName, gen2Region);
  removeProperties(gen2Resource, ['DualStackDomainName', 'DomainName', 'BucketName', 'Arn', 'RegionalDomainName', 'Tags', 'WebsiteURL']);

  expect(gen2Resource).toEqual(gen1Resource);
}

export async function assertFunctionResource(projRoot: string, gen1FunctionName: string, gen1Region: string) {
  const gen1Resource = await getResourceDetails('AWS::Lambda::Function', gen1FunctionName, gen1Region);
  removeProperties(gen1Resource, ['Arn', 'FunctionName', 'LoggingConfig.LogGroup', 'Role']);
  // TODO: remove below line after Tags inconsistency is fixed
  removeProperties(gen1Resource, ['Tags']);

  const gen2Meta = getProjectOutputs(projRoot);
  const gen2Region = gen2Meta.auth.aws_region;
  const gen2StackName = toStackName({ name: userInfo().username, namespace: 'my-gen2-app', type: 'sandbox' });
  const outputs = (await describeCloudFormationStack(gen2StackName, gen2Region)).Outputs;
  const gen2FunctionName = JSON.parse(
    outputs?.find((output: { OutputKey: string }) => output.OutputKey === 'definedFunctions')?.OutputValue ?? '[]',
  )[0];
  const gen2Resource = await getResourceDetails('AWS::Lambda::Function', gen2FunctionName, gen2Region);
  removeProperties(gen2Resource, ['Arn', 'FunctionName', 'LoggingConfig.LogGroup', 'Role']);
  // TODO: remove below line after Environment.Variables.AMPLIFY_SSM_ENV_CONFIG, Tags inconsistency is fixed
  removeProperties(gen2Resource, ['Environment.Variables.AMPLIFY_SSM_ENV_CONFIG', 'Tags']);

  expect(gen2Resource).toEqual(gen1Resource);
}

export async function assertDataResource(projRoot: string, gen1GraphQLAPIId: string, gen1Region: string) {
  const gen1Resource = await getAppSyncApi(gen1GraphQLAPIId, gen1Region);
  const gen1DataSource = (await getAppSyncDataSource(gen1GraphQLAPIId, 'TodoTable', gen1Region)) as Record<string, unknown>;
  removeProperties(gen1DataSource, ['dataSourceArn', 'serviceRoleArn']);
  removeProperties(gen1Resource, [
    'graphqlApi.name',
    'graphqlApi.apiId',
    'graphqlApi.arn',
    'graphqlApi.uris',
    'graphqlApi.tags',
    'graphqlApi.dns',
  ]);
  // TODO: remove below line after authenticationType inconsistency is fixed
  removeProperties(gen1Resource, ['graphqlApi.authenticationType']);

  const gen2Meta = getProjectOutputs(projRoot);
  const gen2Region = gen2Meta.data.aws_region;
  const gen2StackName = toStackName({ name: userInfo().username, namespace: 'my-gen2-app', type: 'sandbox' });
  const outputs = (await describeCloudFormationStack(gen2StackName, gen2Region)).Outputs;
  const gen2GraphQLAPIId = outputs?.find((output: { OutputKey: string }) => output.OutputKey === 'awsAppsyncApiId')?.OutputValue ?? '';
  const gen2Resource = await getAppSyncApi(gen2GraphQLAPIId, gen2Region);
  const gen2DataSource = (await getAppSyncDataSource(gen2GraphQLAPIId, 'TodoTable', gen1Region)) as Record<string, unknown>;
  removeProperties(gen2DataSource, ['dataSourceArn', 'serviceRoleArn']);
  removeProperties(gen2Resource, [
    'graphqlApi.name',
    'graphqlApi.apiId',
    'graphqlApi.arn',
    'graphqlApi.uris',
    'graphqlApi.tags',
    'graphqlApi.additionalAuthenticationProviders',
    'graphqlApi.dns',
  ]);
  // TODO: remove below line after authenticationType, userPoolConfig inconsistency is fixed
  removeProperties(gen2Resource, ['graphqlApi.authenticationType', 'graphqlApi.userPoolConfig']);

  expect(gen2DataSource).toEqual(gen1DataSource);
  expect(gen2Resource).toEqual(gen2Resource);
}

function removeProperties(obj: Record<string, unknown>, propertiesToRemove: string[]) {
  propertiesToRemove.forEach((prop) => unset(obj, prop));
}

const getProjectOutputsPath = (projectRoot: string) => path.join(projectRoot, 'amplify_outputs.json');

const getProjectOutputs = (projectRoot: string): $TSAny => {
  const metaFilePath: string = getProjectOutputsPath(projectRoot);
  return JSON.parse(fs.readFileSync(metaFilePath, 'utf8'));
};

export async function cleanupProjects(cwd: string) {
  await deleteGen1Project(path.join(cwd, '.amplify', 'migration'));
  await deleteGen2Sandbox(cwd);
  deleteProjectDir(cwd);
}
