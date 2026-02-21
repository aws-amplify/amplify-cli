import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import { AmplifyClient, GetAppCommand, GetBackendEnvironmentCommand } from '@aws-sdk/client-amplify';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import {
  CloudFormationClient,
  DescribeStackResourcesOutput,
  DescribeStackResourcesCommand,
  DescribeStackResourcesInput,
  StackResource,
} from '@aws-sdk/client-cloudformation';
import {
  CognitoIdentityProviderClient,
  DescribeUserPoolClientCommand,
  DescribeUserPoolCommand,
  GetUserPoolMfaConfigCommand,
  ListGroupsCommand,
  ListIdentityProvidersCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoIdentityClient, DescribeIdentityPoolCommand } from '@aws-sdk/client-cognito-identity';
import { compareDirectories } from '../directory-diff';
import chalk from 'chalk';

jest.setTimeout(60 * 60 * 1000);
jest.unmock('fs-extra');

import { AmplifyMigrationGenerateStep } from '../../../../commands/gen2-migration/generate';
import { Logger } from '../../../../commands/gen2-migration';
import { BackendDownloader } from '../../../../commands/gen2-migration/generate/codegen-head/backend_downloader';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';

test('project boards snapshot', async () => {
  // mock amplify client
  const amplifyClientMock = mockClient(AmplifyClient);
  amplifyClientMock.on(GetBackendEnvironmentCommand).resolves({
    backendEnvironment: {
      stackName: 'asd',
      backendEnvironmentArn: 'arn',
      createTime: new Date(),
      environmentName: 'main',
      updateTime: new Date(),
    },
  });
  amplifyClientMock.on(GetAppCommand).resolves({
    app: {
      name: 'project-boards',
      appArn: 'arn',
      appId: 'id',
      repository: 'repo',
      description: 'dec',
      platform: 'WEB',
      createTime: new Date(),
      updateTime: new Date(),
      environmentVariables: {},
      defaultDomain: 'domain',
      enableBasicAuth: true,
      enableBranchAutoBuild: false,
    },
  });

  const lambdaClientMock = mockClient(LambdaClient);
  lambdaClientMock.on(GetFunctionCommand).resolves({
    Configuration: {
      FunctionName: 'quotegenerator-main',
      Runtime: 'nodejs22.x',
    },
  });

  const logger = new Logger('generate', 'project-boards', 'main');
  const generate = new AmplifyMigrationGenerateStep(logger, 'main', 'project-boards', '34234', 'stackname', 'us-east-1', {} as any);
  const appPath = path.join(__dirname, '..', '..', '..', '..', '..', '..', '..', 'amplify-migration-apps', 'project-boards');
  const inputPath = path.join(appPath, '_snapshot.input');

  const cfnClientMock = mockClient(CloudFormationClient);
  cfnClientMock
    .on(DescribeStackResourcesCommand)
    .callsFake(async (input: DescribeStackResourcesInput): Promise<DescribeStackResourcesOutput> => {
      const ccbPath = path.join(inputPath, 'amplify', '#current-cloud-backend');
      const templatePath = findTemplatePath(input.StackName!, ccbPath);

      const template: any = JSONUtilities.readJson(templatePath);

      const stackResources: StackResource[] = [];
      for (const logicalId of Object.keys(template.Resources)) {
        const resource = template.Resources[logicalId];
        stackResources.push({
          LogicalResourceId: logicalId,

          // TODO - is this right?
          PhysicalResourceId: `${input.StackName}/${logicalId}`,
          ResourceType: resource.Type,
          Timestamp: new Date(),
          ResourceStatus: 'UPDATE_COMPLETE',
        });
      }

      return { StackResources: stackResources };
    });

  const mockCognitoIdentityProviderClient = mockClient(CognitoIdentityProviderClient);
  mockCognitoIdentityProviderClient.on(DescribeUserPoolCommand).resolves({
    UserPool: {
      EmailVerificationMessage: 'Your verification code is {####}',
      EmailVerificationSubject: 'Your verification code',
      SchemaAttributes: [{ Name: 'email', Required: true, Mutable: true }],
    },
  });

  mockCognitoIdentityProviderClient.on(GetUserPoolMfaConfigCommand).resolves({
    SoftwareTokenMfaConfiguration: {},
    MfaConfiguration: 'OFF',
  });

  mockCognitoIdentityProviderClient.on(DescribeUserPoolClientCommand).resolves({
    UserPoolClient: {},
  });

  mockCognitoIdentityProviderClient.on(ListIdentityProvidersCommand).resolves({
    Providers: [],
  });

  mockCognitoIdentityProviderClient.on(ListGroupsCommand).resolves({
    Groups: [],
  });

  const mockCognitoIdentityClient = mockClient(CognitoIdentityClient);
  mockCognitoIdentityClient.on(DescribeIdentityPoolCommand).resolves({
    AllowUnauthenticatedIdentities: false,
    IdentityPoolName: 'name',
  });

  await withTempDir(async () => {
    copyDirSync(inputPath, path.join(process.cwd(), 'project-boards'));

    process.chdir('project-boards');
    (BackendDownloader as any).ccbDir = path.join('amplify', '#current-cloud-backend');

    const operations = await generate.execute();
    for (const operation of operations) {
      await operation.execute();
    }

    const expected = path.join(appPath, '_snapshot.expected');
    const actual = path.join(process.cwd(), '..', 'project-boards');

    const diffReport = [
      '======= Snapshot Comparison Report =======',
      '',
      ` • Actual: ${actual}`,
      ` • Expected: ${expected}`,
      '',
      '------------------------------------------',
      '',
    ];

    const differences = await compareDirectories({ expectedDir: expected, actualDir: actual, ignorePatterns: [/node_modules/] });
    // first print the missing/extra files
    for (const difference of differences.filter((f) => !f.diff)) {
      switch (difference.diffType) {
        case 'missing':
          diffReport.push(chalk.bold(chalk.red(`(-) ${difference.relativePath} (${difference.diffType})`)));
          break;
        case 'extra':
          diffReport.push(chalk.bold(chalk.green(`(+) ${difference.relativePath} (${difference.diffType})`)));
          break;
        case 'modified':
          // handled separately below
          break;
        default:
          throw new Error(`Unrecognized diff type: ${difference.diffType}`);
      }
    }

    diffReport.push('');

    // then print the modified files
    for (const difference of differences.filter((f) => f.diff)) {
      diffReport.push(chalk.bold(chalk.yellow(`(~) ${difference.relativePath} (${difference.diffType})`)));
      diffReport.push('');
      diffReport.push(difference.diff!);
    }

    console.log(diffReport.join('\n'));
  });
});

async function withTempDir(callback: () => Promise<void>) {
  const cwd = process.cwd();
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'aasd'));
  console.log(tmpDir);
  process.chdir(tmpDir);
  try {
    console.log(`cwd: ${tmpDir}`);
    await callback();
  } finally {
    process.chdir(cwd);
  }
}

function copyDirSync(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function findTemplatePath(stackName: string, ccbPath: string): string {
  const parts = stackName.split('/');

  if (parts.length === 1) {
    return path.join(ccbPath, 'awscloudformation', 'build', 'root-cloudformation-stack.json');
  }

  if (parts[1].startsWith('auth')) {
    const authName = parts[1].substring(4);
    return path.join(ccbPath, 'auth', authName, 'build', `${authName}-cloudformation-template.json`);
  }

  if (parts[1].startsWith('storage')) {
    const storageName = parts[1].substring(7);
    return path.join(ccbPath, 'storage', storageName, 'build', 'cloudformation-template.json');
  }

  if (parts[1].startsWith('function')) {
    const functionName = parts[1].substring(8);
    return path.join(ccbPath, 'function', functionName, `${functionName}-cloudformation-template.json`);
  }

  if (parts[1].startsWith('api')) {
    const apiName = parts[1].substring(3);

    if (parts.length === 2) {
      return path.join(ccbPath, 'api', apiName, 'build', 'cloudformation-template.json');
    }

    if (parts.length === 3) {
      let nestedStackName = parts[2];
      if (nestedStackName === 'CustomResourcesjson') {
        // why god why
        nestedStackName = 'CustomResources';
      }
      return path.join(ccbPath, 'api', apiName, 'build', 'stacks', `${nestedStackName}.json`);
    }

    throw new Error(`Unexpected number of parts for stack: ${stackName}`);
  }

  throw new Error(`Unable to locate template path for stack: ${stackName}`);
}
