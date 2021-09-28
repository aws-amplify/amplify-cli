import { JSONUtilities } from 'amplify-cli-core';
import { AuthInputState } from '../../../../provider-utils/awscloudformation/auth-inputs-manager/auth-input-state';
import { CognitoCLIInputs } from '../../../../provider-utils/awscloudformation/service-walkthrough-types/awsCognito-user-input-types';
import * as path from 'path';

jest.mock('amplify-cli-core', () => ({
  pathManager: {
    getBackendDirPath: jest.fn().mockReturnValue('mockbackendDirPath'),
    findProjectRoot: jest.fn().mockReturnValue('mockProject'),
  },
}));

test('Auth Input State -> validate cli payload manual payload', () => {
  const resourceName = 'mockResource';
  const authState = new AuthInputState(resourceName);
  const cliInputs = JSONUtilities.readJson<CognitoCLIInputs>(path.join(__dirname, '..', '..', 'mocks', 'cli-inputs.json'));
  expect(authState.isCLIInputsValid(cliInputs)).toBeTruthy();
});
