import { $TSContext, AmplifyFrontend } from 'amplify-cli-core';
import { removeResource } from '../../../provider-utils/awscloudformation/index';
import path from 'path';

const mockRemoveResource = removeResource as jest.MockedFunction< typeof removeResource >;
const mockResource = 'resource12345';
mockRemoveResource.mockImplementation((context: $TSContext, service: string): Promise<string> => {
    return new Promise<string>((resolve) => {
		resolve(mockResource);
	});
});

jest.mock('amplify-cli-core');
jest.mock('../../../provider-utils/awscloudformation/index');


describe('remove command tests', () => {
    const provider = 'awscloudformation';
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('remove resource workflow is invoked for map service', async() => {
        const service = 'Map';
        const mockContext = {
            amplify: {
                serviceSelectionPrompt: async () => {
                    return { service: service, providerName: provider};
                }
            },
            print: {
                info: jest.fn()
            }
        };

        let commandPath = path.normalize(path.join(__dirname, '..', '..', '..',  'commands', 'geo', 'remove'));
        const commandModule = require(commandPath);
        await commandModule.run(mockContext);

        expect(mockRemoveResource).toHaveBeenCalledWith(mockContext, service);
    });
});