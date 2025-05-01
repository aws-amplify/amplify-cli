import { pathManager } from '@aws-amplify/amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { getCfnFiles } from '../push-resources';
import * as glob from 'glob';

// Mock data
const dummyCFNFiles: readonly string[] = ['fileA', 'fileB'];
const dummyNestedCFNFiles: readonly string[] = ['nested_fileA', 'nested_fileB'];
const testBackendDirPath = path.join('backendTest', 'path');

// Mocks
jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('fs-extra');
jest.mock('../system-config-manager');
jest.mock('glob');

const pathManager_mock = jest.mocked(pathManager);
pathManager_mock.getBackendDirPath.mockReturnValue(testBackendDirPath);

const glob_mock = glob as jest.Mocked<typeof glob>;
glob_mock.globSync.mockImplementation((pattern) => {
  //eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (pattern) {
    case '*template*.+(yaml|yml|json)':
      return [...dummyCFNFiles];
    case 'stacks/*.+(yaml|yml|json)':
      return [...dummyNestedCFNFiles];
  }
  return [];
});

const fs_mock = jest.mocked(fs);
fs_mock.lstatSync.mockImplementation(() => {
  return {
    isDirectory: jest.fn().mockReturnValue(true),
  } as unknown as fs.Stats;
});
const fsSpy = jest.spyOn(fs_mock, 'existsSync');

describe('test getCfnFiles', () => {
  it('does return API category stack from the build directory', async () => {
    // The build path generated have files, so should be returned.
    fs_mock.existsSync.mockReturnValue(true);
    glob_mock.globSync.mockImplementationOnce(() => [...dummyCFNFiles]);

    // call the function under test
    const { resourceDir, cfnFiles } = getCfnFiles('api', 'api-resource-name');
    expect(resourceDir).toStrictEqual('backendTest/path/api/api-resource-name/build');
    expect(fsSpy).toHaveBeenCalledWith('backendTest/path/api/api-resource-name/build');
    expect(cfnFiles).toEqual(dummyCFNFiles);
  });

  it('does return API category stack from the build directory along with all nested stacks', async () => {
    // The build path generated have files, so should be returned.
    fs_mock.existsSync.mockReturnValue(true);

    // call the function under test
    const { resourceDir, cfnFiles } = getCfnFiles('api', 'api-resource-name', true);
    expect(resourceDir).toStrictEqual('backendTest/path/api/api-resource-name/build');
    expect(fsSpy).toHaveBeenCalledWith('backendTest/path/api/api-resource-name/build');

    // Should return all the CFN files
    expect(cfnFiles).toEqual(dummyCFNFiles.concat(dummyNestedCFNFiles));
  });

  it('does not return the build directory since it does not exist', async () => {
    // The build path generated doesn't have files so fall back to the top level.
    fs_mock.existsSync.mockReturnValue(false);
    glob_mock.globSync.mockImplementationOnce(() => [...dummyCFNFiles]);

    // call the function under test
    const { resourceDir, cfnFiles } = getCfnFiles('api', 'api-resource-name');
    expect(resourceDir).toStrictEqual('backendTest/path/api/api-resource-name');
    expect(fsSpy).toHaveBeenCalledWith('backendTest/path/api/api-resource-name/build');
    expect(cfnFiles).toEqual(dummyCFNFiles);
  });
});
