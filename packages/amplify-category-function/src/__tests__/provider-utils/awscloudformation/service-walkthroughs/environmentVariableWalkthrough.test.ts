import { askEnvironmentVariableQuestions } from '../../../../provider-utils/awscloudformation/service-walkthroughs/environmentVariableWalkthrough';

jest.mock('../../../../provider-utils/awscloudformation/secrets/functionSecretsStateManager');

jest.mock('inquirer', () => ({
  prompt: () => new Promise((resolve) => resolve({ operation: 'abort' })),
}));

jest.mock('../../../../provider-utils/awscloudformation/utils/environmentVariablesHelper', () => ({
  getStoredEnvironmentVariables: jest.fn().mockResolvedValue({}),
}));

describe('askEnvironmentVariableQuestions', () => {
  it('does not throw error', () => {
    expect(async () => {
      await askEnvironmentVariableQuestions('test');
    }).not.toThrow();
  });
});
