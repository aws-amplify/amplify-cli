import { $TSContext } from 'amplify-cli-core';
import { run } from '../../commands/custom/remove';

jest.mock('amplify-cli-core');

describe('remove custom resource command tests', () => {
  let mockContext: $TSContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {
      amplify: {},
      parameters: {},
    } as unknown as $TSContext;
  });

  it('remove resource workflow is invoked for custom resources with no params', async () => {
    mockContext.amplify.removeResource = jest.fn().mockImplementation(async () => {
      return;
    });

    await run(mockContext);

    expect(mockContext.amplify.removeResource).toHaveBeenCalledWith(mockContext, 'custom', undefined);
  });

  it('remove resource workflow is invoked for custom resource with params as resourceName', async () => {
    const mockResourceName = 'mockResourceName';
    mockContext.parameters.first = mockResourceName;
    mockContext.amplify.removeResource = jest.fn().mockImplementation(async () => {
      return;
    });

    await run(mockContext);

    expect(mockContext.amplify.removeResource).toHaveBeenCalledWith(mockContext, 'custom', mockResourceName);
  });
});
