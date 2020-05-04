import fs from 'fs-extra';
import pathManager from '../../../../src/extensions/amplify-helpers/path-manager';
import { getEnvInfo } from '../../../../src/extensions/amplify-helpers/get-env-info';
import { readJsonFile } from '../../../../src/extensions/amplify-helpers/read-json-file';
import { saveEnvResourceParameters } from '../../../../src/extensions/amplify-helpers/envResourceParams';

jest.mock('fs-extra');
jest.mock('../../../../src/extensions/amplify-helpers/path-manager', () => ({getProviderInfoFilePath: jest.fn()}));
jest.mock('../../../../src/extensions/amplify-helpers/get-env-info', () => ({getEnvInfo: jest.fn()}));
jest.mock('../../../../src/extensions/amplify-helpers/read-json-file', () => ({readJsonFile: jest.fn()}));

beforeAll(() => {
  (fs.existsSync as any).mockReturnValue(true);
  (getEnvInfo as any).mockReturnValue({envName: 'testEnv'});
  (pathManager.getProviderInfoFilePath as any).mockReturnValue('test/path');
});

test('saveEnvResourceParams appends to existing params', () => {
  const contextStub = {};
  const existingParams = {
    testEnv: {
      categories: {
        testCategory: {
          testResourceName: {
            existingParam: 'existingParamValue',
          },
        },
      },
    },
  };
  (readJsonFile as any).mockReturnValue(existingParams);

  saveEnvResourceParameters(contextStub, 'testCategory', 'testResourceName', {newParam: 'newParamValue'});
  
  const writeFileSyncMock: any = fs.writeFileSync;
  expect(writeFileSyncMock).toHaveBeenCalled();
  const callParams = writeFileSyncMock.mock.calls[0];
  expect(callParams[0]).toEqual('test/path');
  const expectedParams = {
    testEnv: {
      categories: {
        testCategory: {
          testResourceName: {
            existingParam: 'existingParamValue',
            newParam: 'newParamValue',
          },
        },
      },
    },
  };
  expect(JSON.parse(callParams[1])).toEqual(expectedParams);
});