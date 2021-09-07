import { transformCfnWithOverrides } from '../../override-manager/transform-cfn';
import { $TSContext, IAmplifyResource } from 'amplify-cli-core';

jest.mock('../../override-manager/index');
// jest.mock('amplify-cli-core');

const context_stub = {
  parameters: {
    options: [],
  },
};

const context_stub_typed = context_stub as unknown as $TSContext;

test('check transformCfn call', async () => {
  const resource: IAmplifyResource = {
    category: 'default',
    service: 'service',
    resourceName: 'mockResourceName',
  };
  await expect(transformCfnWithOverrides(context_stub_typed, resource)).rejects.toThrow(new Error('Method not implemented.'));
});
