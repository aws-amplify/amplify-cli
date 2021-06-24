import { $TSContext, AmplifyFrontend } from 'amplify-cli-core';
import { removeWalkthrough } from '../../../provider-utils/awscloudformation/service-walkthroughs/removeWalkthrough';
import path from 'path';
import { category } from '../../../constants';

const mockRemoveWalkthrough = removeWalkthrough as jest.MockedFunction< typeof removeWalkthrough >;
const mockResource = 'resource12345';
mockRemoveWalkthrough.mockImplementation((context: $TSContext, service: string): Promise<string> => {
    return new Promise<string>((resolve) => {
		resolve(mockResource);
	});
});

jest.mock('amplify-cli-core');
jest.mock('../../../provider-utils/awscloudformation/service-walkthroughs/removeWalkthrough');


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
                },
                removeResource: jest.fn()
            },
            print: {
                info: jest.fn()
            }
        };

        mockContext.amplify.removeResource.mockImplementation((context: $TSContext, category: string, resourceToRemove: string): {} => {
            return {
                resource: mockResource,
                catch: jest.fn()
            };
        });

        let commandPath = path.normalize(path.join(__dirname, '..', '..', '..',  'commands', 'geo', 'remove'));
        const commandModule = require(commandPath);
        await commandModule.run(mockContext);

        expect(mockRemoveWalkthrough).toHaveBeenCalledWith(mockContext, service);
        expect(mockContext.amplify.removeResource).toHaveBeenCalledWith(mockContext, category, mockResource);
    });
});