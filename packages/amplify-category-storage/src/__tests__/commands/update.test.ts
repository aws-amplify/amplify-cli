import { $TSContext, $TSObject } from 'amplify-cli-core';
import { run } from '../../commands/storage/update';
import * as providerController from '../../provider-utils/awscloudformation/index';

jest.mock('../../provider-utils/awscloudformation/index');
jest.mock('amplify-cli-core');

const providerController_mock = providerController as jest.Mocked<typeof providerController>;
providerController_mock.updateResource.mockImplementation = jest.fn().mockImplementation(async () => {
  return 'mockResourceName';
});

describe('update ddb command tests', () => {
  const provider = 'awscloudformation';
  let mockContext: $TSContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {
      amplify: {},
    } as unknown as $TSContext;
  });

  it('update resource workflow is invoked for DDB', async () => {
    const service = 'DynamoDB';
    mockContext.amplify.serviceSelectionPrompt = jest.fn().mockImplementation(async () => {
      return { service: service, providerName: provider };
    });

    await run(mockContext);

    expect(providerController_mock.updateResource).toHaveBeenCalledWith(mockContext, 'storage', service);
  });
});
