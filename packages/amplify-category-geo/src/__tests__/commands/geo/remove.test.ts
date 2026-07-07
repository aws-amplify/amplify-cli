import { $TSContext, stateManager, $TSObject } from '@aws-amplify/amplify-cli-core';
import { removeResource } from '../../../provider-controllers';
import { ServiceName } from '../../../service-utils/constants';
import { run } from '../../../commands/geo/remove';

const mockRemoveResource = removeResource as jest.MockedFunction<typeof removeResource>;
const mockResource = 'resource12345';
mockRemoveResource.mockImplementation((): Promise<string> => {
  return new Promise<string>((resolve) => {
    resolve(mockResource);
  });
});

jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('../../../provider-controllers');

describe('remove command tests', () => {
  const provider = 'awscloudformation';
  let mockContext: $TSContext;
  // construct mock amplify meta
  const mockAmplifyMeta: $TSObject = {
    providers: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {
      print: {
        info: jest.fn(),
        warning: jest.fn(),
      },
      amplify: {},
    } as unknown as $TSContext;
    mockAmplifyMeta.providers[provider] = {
      Region: 'us-west-2',
    };
    stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
  });

  it('remove resource workflow is invoked for map service', async () => {
    const service = ServiceName.Map;
    mockContext.amplify.serviceSelectionPrompt = jest.fn().mockImplementation(async () => {
      return { service: service, providerName: provider };
    });

    await run(mockContext);

    expect(mockRemoveResource).toHaveBeenCalledWith(mockContext, service);
  });

  it('remove resource workflow is invoked for place index service', async () => {
    const service = ServiceName.PlaceIndex;
    mockContext.amplify.serviceSelectionPrompt = jest.fn().mockImplementation(async () => {
      return { service: service, providerName: provider };
    });

    await run(mockContext);

    expect(mockRemoveResource).toHaveBeenCalledWith(mockContext, service);
  });

  it('remove resource workflow is invoked for geofence collection service', async () => {
    const service = ServiceName.GeofenceCollection;
    mockContext.amplify.serviceSelectionPrompt = jest.fn().mockImplementation(async () => {
      return { service: service, providerName: provider };
    });

    await run(mockContext);

    expect(mockRemoveResource).toHaveBeenCalledWith(mockContext, service);
  });
});
