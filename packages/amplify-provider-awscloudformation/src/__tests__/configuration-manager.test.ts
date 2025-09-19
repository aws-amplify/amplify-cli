import { $TSContext, pathManager, JSONUtilities } from '@aws-amplify/amplify-cli-core';
import _ from 'lodash';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as configManager from '../configuration-manager';
import { loadConfigurationForEnv } from '../configuration-manager';

jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('fs-extra');
jest.mock('../system-config-manager');

const pathManager_mock = jest.mocked(pathManager);
const JSONUtilities_mock = jest.mocked(JSONUtilities);
const fs_mock = jest.mocked(fs);

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

const resolveRegionSpy = jest.spyOn(configManager, 'resolveRegion');

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

  it('uses region in awsConfigInfo.config if present', async () => {
    const contextStub = {
      exeInfo: {
        awsConfigInfo: {
          config: {
            accessKeyId: 'testAccessKey',
            secretAccessKey: 'testSecretKey',
            region: 'us-test-1',
          },
        },
      },
    } as $TSContext;
    const result = await loadConfigurationForEnv(contextStub, 'test');
    expect(result).toMatchInlineSnapshot(`
      {
        "credentials": {
          "accessKeyId": "testAccessKey",
          "secretAccessKey": "testSecretKey",
          "sessionToken": undefined,
        },
        "region": "us-test-1",
      }
    `);
    expect(resolveRegionSpy).not.toBeCalled();
  });

  it('copies resolved region to config.region', async () => {
    const contextStub = {
      exeInfo: {
        awsConfigInfo: {
          config: {
            accessKeyId: 'testAccessKey',
            secretAccessKey: 'testSecretKey',
          },
        },
      },
    } as $TSContext;
    const origRegion = process.env.AWS_REGION;
    process.env.AWS_REGION = 'us-test-2';
    const result = await loadConfigurationForEnv(contextStub, 'test');
    expect(result).toMatchInlineSnapshot(`
      {
        "credentials": {
          "accessKeyId": "testAccessKey",
          "secretAccessKey": "testSecretKey",
          "sessionToken": undefined,
        },
        "region": "us-test-2",
      }
    `);
    process.env.AWS_REGION = origRegion;
  });
});
