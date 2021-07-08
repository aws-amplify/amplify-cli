import { $TSContext, $TSObject } from 'amplify-cli-core';
import { updateResource } from '../../../provider-controllers/index';
import path from 'path';
import { ServiceName } from '../../../service-utils/constants';

const mockUpdateResource = updateResource as jest.MockedFunction< typeof updateResource >;
mockUpdateResource.mockImplementation((context: $TSContext, service: string): Promise<string> => {
    return new Promise<string>((resolve) => {
		resolve(service);
	});
});

jest.mock('amplify-cli-core');
jest.mock('../../../provider-controllers/index');


describe('update command tests', () => {
    const provider = 'awscloudformation';
    const commandPath = path.normalize(path.join(__dirname, '..', '..', '..',  'commands', 'geo', 'update'));
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

    it('update resource workflow is invoked for map service', async() => {
        const service = ServiceName.Map;
        mockContext.amplify.serviceSelectionPrompt = async () => {
            return { service: service, providerName: provider};
        };

        await commandModule.run(mockContext);

        expect(mockUpdateResource).toHaveBeenCalledWith(mockContext, service);
    });

    it('update resource workflow is invoked for place index service', async() => {
        const service = ServiceName.PlaceIndex;
        mockContext.amplify.serviceSelectionPrompt = async () => {
            return { service: service, providerName: provider};
        };

        await commandModule.run(mockContext);

        expect(mockUpdateResource).toHaveBeenCalledWith(mockContext, service);
    });
});