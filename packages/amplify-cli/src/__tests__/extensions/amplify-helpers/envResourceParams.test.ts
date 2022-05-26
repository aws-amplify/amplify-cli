import * as fs from 'fs-extra';
import {
  pathManager,
} from 'amplify-cli-core';
import { getEnvInfo } from '../../../extensions/amplify-helpers/get-env-info';
import {
  saveEnvResourceParameters,
  loadEnvResourceParameters,
  removeResourceParameters,
} from '../../../extensions/amplify-helpers/envResourceParams';

jest.mock('fs-extra');
jest.mock('amplify-cli-core', () => ({
  pathManager: { getTeamProviderInfoFilePath: jest.fn() },
  stateManager: {
    getTeamProviderInfo: jest.fn(),
    setTeamProviderInfo: jest.fn(),
    getLocalEnvInfo: jest.fn().mockReturnValue({ envName: 'testEnv' }),
  },
}));
jest.mock('../../../extensions/amplify-helpers/get-env-info', () => ({ getEnvInfo: jest.fn() }));

let getEnvParamManager;
let ensureEnvParamManager;

beforeEach(async () => {
  ({ ensureEnvParamManager, getEnvParamManager } = await import('@aws-amplify/amplify-environment-parameters'));
  await ensureEnvParamManager('testEnv');
  jest.clearAllMocks();
  (fs.existsSync as any).mockReturnValue(true);
  (getEnvInfo as any).mockReturnValue({ envName: 'testEnv' });
  (pathManager.getTeamProviderInfoFilePath as any).mockReturnValue('test/path');
});

test('saveEnvResourceParams appends to existing params', () => {
  getEnvParamManager('testEnv').getResourceParamManager('testCategory', 'testResourceName').setParam('existingParam', 'existingParamValue');

  saveEnvResourceParameters(undefined, 'testCategory', 'testResourceName', { newParam: 'newParamValue' });

  expect(getEnvParamManager('testEnv').getResourceParamManager('testCategory', 'testResourceName').getAllParams()).toEqual({
    existingParam: 'existingParamValue',
    newParam: 'newParamValue',
  });
});

test('loadEnvResourceParameters load params from environment param manager', () => {
  getEnvParamManager('testEnv').getResourceParamManager('testCategory2', 'testResourceName').setParam('existingParam', 'existingParamValue');
  const params = loadEnvResourceParameters(undefined, 'testCategory2', 'testResourceName');

  expect(params).toEqual({
    existingParam: 'existingParamValue',
  });
});

test('removeResourceParameters remove resource params from team provider info', () => {
  getEnvParamManager('testEnv').getResourceParamManager('testCategory', 'testResourceName').setParam('existingParam', 'existingParamValue');
  removeResourceParameters(undefined, 'testCategory', 'testResourceName');
  expect(getEnvParamManager('testEnv').hasResourceParamManager('testCategory', 'testResourceName')).toBe(false);
});
