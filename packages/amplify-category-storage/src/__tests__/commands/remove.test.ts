import { $TSContext } from 'amplify-cli-core';
import { run } from '../../commands/storage/remove';
import * as providerController from '../../provider-utils/awscloudformation/index';

jest.mock('../../provider-utils/awscloudformation/index');
jest.mock('amplify-cli-core');

const providerController_mock = providerController as jest.Mocked<typeof providerController>;
providerController_mock.updateResource.mockImplementation = jest.fn().mockImplementation(async () => {
  return 'mockResourceName';
});

describe('remove ddb command tests', () => {
  let mockContext: $TSContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {
      amplify: {},
      parameters: {},
    } as unknown as $TSContext;
  });

  it('update resource workflow is invoked for DDB with no params', async () => {
    mockContext.amplify.removeResource = jest.fn().mockImplementation(async () => {
      return;
    });

    await run(mockContext);

    expect(mockContext.amplify.removeResource).toHaveBeenCalledWith(mockContext, 'storage', undefined);
  });

  it('update resource workflow is invoked for DDB with params as resourceName', async () => {
    const mockResourceName = 'mockResourceName';
    mockContext.parameters.first = mockResourceName;
    mockContext.amplify.removeResource = jest.fn().mockImplementation(async () => {
      return;
    });

    await run(mockContext);

    expect(mockContext.amplify.removeResource).toHaveBeenCalledWith(mockContext, 'storage', mockResourceName);
  });
});


describe('remove s3 command tests', () => {
  let mockContext: $TSContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {
      amplify: {},
      parameters: {},
    } as unknown as $TSContext;
  });

  it('update resource workflow is invoked for s3 with no params', async () => {
    mockContext.amplify.removeResource = jest.fn().mockImplementation(async () => {
      return;
    });

    await run(mockContext);

    expect(mockContext.amplify.removeResource).toHaveBeenCalledWith(mockContext, 'storage', undefined);
  });

  it('update resource workflow is invoked for s3 with params as resourceName', async () => {
    const mockResourceName = 'mockResourceName';
    mockContext.parameters.first = mockResourceName;
    mockContext.amplify.removeResource = jest.fn().mockImplementation(async () => {
      return;
    });

    await run(mockContext);

    expect(mockContext.amplify.removeResource).toHaveBeenCalledWith(mockContext, 'storage', mockResourceName);
  });
});

