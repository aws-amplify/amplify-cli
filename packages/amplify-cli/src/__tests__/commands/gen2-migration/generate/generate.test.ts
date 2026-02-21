import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import 'aws-sdk-client-mock-jest';
import { mockClient } from 'aws-sdk-client-mock';
import { AmplifyClient, GetAppCommand, GetBackendEnvironmentCommand } from '@aws-sdk/client-amplify';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import { compareDirectories } from '../directory-diff';
import chalk from 'chalk';

jest.setTimeout(60 * 60 * 1000);
jest.unmock('fs-extra');

import { AmplifyMigrationGenerateStep } from '../../../../commands/gen2-migration/generate';
import { Logger } from '../../../../commands/gen2-migration';
import { BackendDownloader } from '../../../../commands/gen2-migration/generate/codegen-head/backend_downloader';

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

    const differences = await compareDirectories({ expectedDir: expected, actualDir: actual, ignoreDirs: ['node_modules'] });
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
