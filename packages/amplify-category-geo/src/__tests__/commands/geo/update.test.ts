import { $TSContext, stateManager, $TSObject } from 'amplify-cli-core';
import { updateResource } from '../../../provider-controllers/index';
import { ServiceName } from '../../../service-utils/constants';
import { run } from '../../../commands/geo/update';

const mockUpdateResource = updateResource as jest.MockedFunction< typeof updateResource >;
mockUpdateResource.mockImplementation(async (_, service: string) => service);

jest.mock('amplify-cli-core');
jest.mock('../../../provider-controllers/index');


describe('update command tests', () => {
    const provider = 'awscloudformation';
    let mockContext: $TSContext;
    // construct mock amplify meta
    const mockAmplifyMeta: $TSObject = {
        providers: {}
    };
    
    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = ({
            print: {
                info: jest.fn(),
                warning: jest.fn()
            },
            amplify: {}
        } as unknown) as $TSContext;
        mockAmplifyMeta.providers[provider] = {
            Region: 'us-west-2'
        };
        stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);
    });

    it('update resource workflow is invoked for map service', async() => {
        const service = ServiceName.Map;
        mockContext.amplify.serviceSelectionPrompt = jest.fn().mockImplementation( async () => {
            return { service: service, providerName: provider };
        });

        await run(mockContext);

        expect(mockUpdateResource).toHaveBeenCalledWith(mockContext, service);
    });

    it('update resource workflow is invoked for place index service', async() => {
        const service = ServiceName.PlaceIndex;
        mockContext.amplify.serviceSelectionPrompt = jest.fn().mockImplementation( async () => {
            return { service: service, providerName: provider };
        });

        await run(mockContext);

        expect(mockUpdateResource).toHaveBeenCalledWith(mockContext, service);
    });

    it('update resource workflow is invoked for Map service in unsupported region', async() => {
        mockAmplifyMeta.providers[provider] = {
            Region: 'eu-west-2'
        };
        stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

        const service = ServiceName.Map;
        mockContext.amplify.serviceSelectionPrompt = jest.fn().mockImplementation( async () => {
            return { service: service, providerName: provider };
        });

        await run(mockContext);
        expect(mockUpdateResource).toHaveBeenCalledWith(mockContext, service);
    });

    it('update resource workflow is invoked for Place Index service in unsupported region', async() => {
        mockAmplifyMeta.providers[provider] = {
            Region: 'eu-west-2'
        };
        stateManager.getMeta = jest.fn().mockReturnValue(mockAmplifyMeta);

        const service = ServiceName.PlaceIndex;
        mockContext.amplify.serviceSelectionPrompt = jest.fn().mockImplementation( async () => {
            return { service: service, providerName: provider };
        });

        await run(mockContext);
        expect(mockUpdateResource).toHaveBeenCalledWith(mockContext, service);
    });
});
