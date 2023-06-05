const inquirer = require('inquirer');
import { generalQuestionsWalkthrough } from '../../../../provider-utils/awscloudformation/service-walkthroughs/generalQuestionsWalkthrough';
import { $TSContext } from '@aws-amplify/amplify-cli-core';

jest.mock('inquirer', () => ({
  prompt: jest.fn(),
}));
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

    inquirer.prompt.mockImplementation(async (questions) => {
      const { validate } = questions[0];
      const validationResult = await validate('existingFunction');
      return { functionName: validationResult };
    });

    const result = await generalQuestionsWalkthrough(mockContext as unknown as $TSContext);

    expect(result.functionName).toBe('A function with this name already exists.');
  });
});
