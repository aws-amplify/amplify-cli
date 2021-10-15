import { $TSContext, $TSObject, AmplifySupportedService } from 'amplify-cli-core';
import { run } from '../../commands/storage/add';
import * as providerController from '../../provider-utils/awscloudformation/index';

jest.mock('../../provider-utils/awscloudformation/index');
jest.mock('amplify-cli-core');

const providerController_mock = providerController as jest.Mocked<typeof providerController>;
providerController_mock.addResource.mockImplementation = jest.fn().mockImplementation(async () => {
  return 'mockResourceName';
});

describe('add ddb command tests', () => {
  const provider = 'awscloudformation';
  let mockContext: $TSContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {
      amplify: {},
    } as unknown as $TSContext;
  });

  it('add resource workflow is invoked for DDB', async () => {
    const service = 'DynamoDB';
    mockContext.amplify.serviceSelectionPrompt = jest.fn().mockImplementation(async () => {
      return { service: service, providerName: provider };
    });

    await run(mockContext);

    expect(providerController_mock.addResource).toHaveBeenCalledWith(mockContext, 'storage', service, {
      service: service,
      providerPlugin: provider,
    });
  });
});

describe('add s3 command tests', () => {
  const provider = 'awscloudformation';
  let mockContext: $TSContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {
      amplify: {},
    } as unknown as $TSContext;
  });

  it('add resource workflow is invoked for S3', async () => {
    const service =  AmplifySupportedService.S3;
    mockContext.amplify.serviceSelectionPrompt = jest.fn().mockImplementation(async () => {
      return { service: service, providerName: provider };
    });

    await run(mockContext);

    expect(providerController_mock.addResource).toHaveBeenCalledWith(mockContext, 'storage', service, {
      service: service,
      providerPlugin: provider,
    });
  });
});
