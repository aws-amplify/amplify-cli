const inquirer = require('inquirer');
import { generalQuestionsWalkthrough } from '../../../../provider-utils/awscloudformation/service-walkthroughs/generalQuestionsWalkthrough';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { prompter } from '@aws-amplify/amplify-prompts';

jest.mock('@aws-amplify/amplify-prompts');
const prompterMock = prompter as jest.Mocked<typeof prompter>;

jest.mock('uuid', () => ({
  v4: () => 'mock-uuid',
}));

describe('generalQuestionsWalkthrough', () => {
  it('should fail validation when function name already exists', async () => {
    const mockContext = {
      amplify: {
        getResourceStatus: jest.fn().mockResolvedValue({
          allResources: [{ resourceName: 'existingFunction' }],
        }),
        inputValidation: () => jest.fn(),
        getProjectDetails: () => ({
          projectConfig: {
            projectName: 'testProject',
          },
        }),
      },
    };

    prompterMock.input.mockImplementation(async (message, options) => {
      return await options.validate('existingFunction');
    });

    const result = await generalQuestionsWalkthrough(mockContext as unknown as $TSContext);

    expect(result.functionName).toBe('A function with this name already exists.');
  });
});
