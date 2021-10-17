import { $TSContext, pathManager, JSONUtilities } from 'amplify-cli-core';
import _ from 'lodash';
import * as fs from 'fs-extra';
import * as path from 'path';
import { loadConfigurationForEnv } from '../configuration-manager';
import { mocked } from 'ts-jest/utils';
import { $TSContext } from 'amplify-cli-core';
import { enableServerlessContainers } from '../configuration-manager';

jest.mock('amplify-cli-core');
jest.mock('fs-extra');
jest.mock('../system-config-manager');
    
jest.setTimeout(15000);

jest.mock('../utils/aws-logger', () => ({
  fileLogger: () => jest.fn(() => jest.fn()),
}));

const pathManager_mock = mocked(pathManager);
const JSONUtilities_mock = mocked(JSONUtilities);
const fs_mock = mocked(fs);

const testPath = path.join('test', 'path');
pathManager_mock.getDotConfigDirPath.mockReturnValue(testPath);
fs_mock.existsSync.mockReturnValue(true);
JSONUtilities_mock.readJson.mockReturnValue({
  oldenv: {
    configLevel: 'project',
    useProfile: true,
    profileName: 'oldprofile',
  },
});
    
const frontend = 'javascript';
const context_stub = ({
  print: {
    info: jest.fn(),
  },
  // Mock construction of exeInfo
  exeInfo: { projectConfig: { frontend, [frontend]: { config: {} } } },
  input: { options: { yes: false } },
} as unknown) as jest.Mocked<$TSContext>;

describe('load configuration for env', () => {
  it('does not overwrite awsConfigInfo in context object', async () => {
    const context_stub = {
      exeInfo: {
        awsConfigInfo: {
          configLevel: 'project',
          config: {
            profileName: 'newprofile',
            useProfile: true,
          },
        },
      },
    } as $TSContext;
    const context_clone = _.cloneDeep(context_stub);
    await loadConfigurationForEnv(context_clone, 'oldenv');
    expect(context_clone).toStrictEqual(context_stub);
  });
});

describe('enableServerlessContainers', () => {
  it('should prompt for a ServerlessContainers value when `--yes` is NOT present', async () => {
    context_stub.input.options.yes = false;
    let prompt = enableServerlessContainers(context_stub);
    // Mock user response
    process.stdin.push('y\n');
    await prompt;

    expect(context_stub.exeInfo.projectConfig[frontend].config.ServerlessContainers).toEqual(true);
  });

  it('should use passed or default ServerlessContainers option when `--yes` is present.', async () => {
    context_stub.input.options.yes = true;
    context_stub.exeInfo.projectConfig[frontend].config.ServerlessContainers = false;

    await enableServerlessContainers(context_stub);

    expect(context_stub.exeInfo.projectConfig[frontend].config.ServerlessContainers).toEqual(false);
  });

  it('should set ServerlessContainers to `false` by default when `--yes` is present, but there is no passed/default value', async () => {
    context_stub.input.options.yes = true;
    context_stub.exeInfo.projectConfig[frontend].config = {};

    await enableServerlessContainers(context_stub);

    expect(context_stub.exeInfo.projectConfig[frontend].config.ServerlessContainers).toEqual(false);
  });
});
