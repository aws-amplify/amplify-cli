import { $TSContext, $TSObject } from 'amplify-cli-core';
import { removeResource } from '../../../provider-controllers';
import path from 'path';
import { ServiceName } from '../../../service-utils/constants';

const mockRemoveResource = removeResource as jest.MockedFunction< typeof removeResource >;
const mockResource = 'resource12345';
mockRemoveResource.mockImplementation((context: $TSContext, service: string): Promise<string> => {
    return new Promise<string>((resolve) => {
		resolve(mockResource);
	});
});

jest.mock('amplify-cli-core');
jest.mock('../../../provider-controllers');


describe('remove command tests', () => {
    const provider = 'awscloudformation';
    const commandPath = path.normalize(path.join(__dirname, '..', '..', '..',  'commands', 'geo', 'remove'));
    const commandModule = require(commandPath);
    let mockContext: $TSObject;
    
    beforeEach(() => {
        jest.clearAllMocks();
        mockContext = {
            print: {
                info: jest.fn()
            },
            amplify: {}
        };
    });

    it('remove resource workflow is invoked for map service', async() => {
        const service = ServiceName.Map;
        mockContext.amplify.serviceSelectionPrompt = async () => {
            return { service: service, providerName: provider};
        };

        await commandModule.run(mockContext);

        expect(mockRemoveResource).toHaveBeenCalledWith(mockContext, service);
    });

    it('remove resource workflow is invoked for place index service', async() => {
        const service = ServiceName.PlaceIndex;
        mockContext.amplify.serviceSelectionPrompt = async () => {
            return { service: service, providerName: provider};
        };

        await commandModule.run(mockContext);

        expect(mockRemoveResource).toHaveBeenCalledWith(mockContext, service);
    });
});