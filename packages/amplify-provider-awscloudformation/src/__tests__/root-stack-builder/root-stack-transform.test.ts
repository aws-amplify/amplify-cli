import { AmplifyRootStackTransform } from '../../root-stack-builder/root-stack-transform';
import { $TSContext } from 'amplify-cli-core';

jest.mock('amplify-cli-core');

describe('Check RootStack Template', () => {
  it('Generated rootstack template during init', async () => {
    const context_stub = {
      input: {
        command: 'init',
      },
    };

    const context_stub_typed = context_stub as unknown as $TSContext;
    // CFN transform for Root stack
    const resourceName = 'awscloudformation';

    const rootTransform = new AmplifyRootStackTransform(resourceName);
    const mock_template = await rootTransform.transform(context_stub_typed);
    expect(mock_template).toMatchSnapshot();
  });
});
