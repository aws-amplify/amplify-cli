import { $TSContext } from 'amplify-cli-core';
import { addResource } from '../../../provider-controllers/index';
import { ServiceName } from '../../../service-utils/constants';
import { run } from '../../../commands/geo/add';

const mockAddResource = addResource as jest.MockedFunction< typeof addResource >;
mockAddResource.mockImplementation(async (_, service: string) => service);

jest.mock('amplify-cli-core');
jest.mock('../../../provider-controllers/index');


describe('add command tests', () => {
    const provider = 'awscloudformation';
    let mockContext: $TSContext;
        
    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = ({
            print: {
                info: jest.fn(),
                warning: jest.fn()
            },
            amplify: {}
        } as unknown) as $TSContext;
    });

    it('add resource workflow is invoked for map service', async() => {
        const service = ServiceName.Map;
        mockContext.amplify.serviceSelectionPrompt = jest.fn().mockImplementation( async () => {
            return { service: service, providerName: provider};
        });

        await run(mockContext);

        expect(mockAddResource).toHaveBeenCalledWith(mockContext, service);
    });

    it('add resource workflow is invoked for place index service', async() => {
        const service = ServiceName.PlaceIndex;
        mockContext.amplify.serviceSelectionPrompt = jest.fn().mockImplementation( async () => {
            return { service: service, providerName: provider};
        });

        await run(mockContext);

        expect(mockAddResource).toHaveBeenCalledWith(mockContext, service);
    });
});
