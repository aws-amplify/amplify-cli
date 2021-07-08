import { $TSContext, $TSObject } from 'amplify-cli-core';
import { addResource } from '../../../provider-controllers/index';
import path from 'path';
import { ServiceName } from '../../../service-utils/constants';

const mockAddResource = addResource as jest.MockedFunction< typeof addResource >;
mockAddResource.mockImplementation((context: $TSContext, service: string): Promise<string> => {
    return new Promise<string>((resolve) => {
		resolve(service);
	});
});

jest.mock('amplify-cli-core');
jest.mock('../../../provider-controllers/index');


describe('add command tests', () => {
    const provider = 'awscloudformation';
    const commandPath = path.normalize(path.join(__dirname, '..', '..', '..',  'commands', 'geo', 'add'));
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

    it('add resource workflow is invoked for map service', async() => {
        const service = ServiceName.Map;
        mockContext.amplify.serviceSelectionPrompt = async () => {
            return { service: service, providerName: provider};
        };

        await commandModule.run(mockContext, service);

        expect(mockAddResource).toHaveBeenCalledWith(mockContext, service);
    });

    it('add resource workflow is invoked for place index service', async() => {
        const service = ServiceName.PlaceIndex;
        mockContext.amplify.serviceSelectionPrompt = async () => {
            return { service: service, providerName: provider};
        };

        await commandModule.run(mockContext, service);

        expect(mockAddResource).toHaveBeenCalledWith(mockContext, service);
    });
});