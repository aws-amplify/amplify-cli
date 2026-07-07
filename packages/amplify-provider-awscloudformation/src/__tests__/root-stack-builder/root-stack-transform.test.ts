import { $TSContext, JSONUtilities } from '@aws-amplify/amplify-cli-core';
import { AmplifyRootStackTransform } from '../../root-stack-builder/root-stack-transform';

jest.mock('@aws-amplify/amplify-cli-core');
const JSONUtilitiesMock = JSONUtilities as jest.Mocked<typeof JSONUtilities>;

JSONUtilitiesMock.stringify.mockImplementation((data) => JSON.stringify(data, null, 2));
JSONUtilitiesMock.parse.mockImplementation((data) => JSON.parse(data));

describe('Root stack template tests', () => {
  it('Generated root stack template during init', async () => {
    const contextStub = {
      input: {
        command: 'init',
      },
    };

    const contextStubTyped = contextStub as unknown as $TSContext;
    // CFN transform for Root stack
    const resourceName = 'awscloudformation';

    const rootTransform = new AmplifyRootStackTransform(resourceName);
    const mockTemplate = await rootTransform.transform(contextStubTyped);
    expect(mockTemplate).toMatchSnapshot();
  });
});
