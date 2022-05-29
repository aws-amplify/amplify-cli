import { $TSContext } from 'amplify-cli-core';
import { run } from '../../commands/custom/build';
import { buildCustomResources } from '../../utils/build-custom-resources';

jest.mock('../../utils/build-custom-resources');
const buildCustomResources_mock = buildCustomResources as jest.MockedFunction<typeof buildCustomResources>;

describe('build custom resources flow', () => {
  let mockContext: $TSContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {
      amplify: {},
      parameters: {},
    } as unknown as $TSContext;
  });

  it('build all custom resources', async () => {
    await run(mockContext);

    expect(buildCustomResources_mock).toHaveBeenCalledWith(mockContext, undefined);
  });

  it('build one custom resource', async () => {
    const mockResourceName = 'mockresourcename';
    mockContext.parameters.first = mockResourceName;

    await run(mockContext);
    expect(buildCustomResources_mock).toHaveBeenCalledWith(mockContext, mockResourceName);
  });
});
