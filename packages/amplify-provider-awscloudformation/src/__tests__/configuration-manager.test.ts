import { $TSContext, pathManager, JSONUtilities } from 'amplify-cli-core';
import _ from 'lodash';
import * as fs from 'fs-extra';
import * as path from 'path';
import { loadConfigurationForEnv } from '../configuration-manager';
import { mocked } from 'ts-jest/utils';

jest.mock('amplify-cli-core');
jest.mock('fs-extra');
jest.mock('../system-config-manager');

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
