import { $TSContext, FeatureFlags } from 'amplify-cli-core';
import { parseInputs } from '../../../../provider-utils/awscloudformation/question-factories/core-questions';
import { getSupportedServices } from '../../../../provider-utils/supported-services';

let mockAmplify = {
  getWhen: jest.fn(),
  inputValidation: jest.fn(),
  getProjectDetails: jest.fn().mockReturnValue('testName'),
};
const mockContext = {} as $TSContext;

describe('core questions', () => {
  beforeEach(() => {
    FeatureFlags.getBoolean = () => false;
  });

  it('should return the correct question', async () => {
    const serviceMetadata = getSupportedServices()['Cognito'];
    const { inputs, defaultValuesFilename, stringMapsFilename } = serviceMetadata;
    for (const input of inputs) {
      const question = await parseInputs(input, mockAmplify, defaultValuesFilename, stringMapsFilename, {}, mockContext);
    }
  });
});
