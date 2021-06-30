import { $TSContext } from 'amplify-cli-core';
import { askEnvironmentVariableQuestions } from '../../../../provider-utils/awscloudformation/service-walkthroughs/environmentVariableWalkthrough';

jest.mock('inquirer', () => {
  return {
    prompt: () => {
      return new Promise(resolve => resolve({ operation: 'abort' }));
    },
  };
});

jest.mock('../../../../provider-utils/awscloudformation/utils/environmentVariablesHelper', () => ({
  getStoredEnvironmentVariables: jest.fn().mockReturnValue({}),
}));

const context_stub = {} as $TSContext;

describe('askEnvironmentVariableQuestions', () => {
  it('does not throw error', () => {
    expect(async () => {
      await askEnvironmentVariableQuestions('test');
    }).not.toThrow();
  });
});
