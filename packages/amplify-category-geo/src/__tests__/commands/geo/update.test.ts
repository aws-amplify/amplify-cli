import { $TSContext } from 'amplify-cli-core';
import { updateResource } from '../../../provider-utils/awscloudformation/index';
import { MapParameters } from '../../../provider-utils/awscloudformation/utils/mapParams';
import path from 'path';

const mockUpdateResource = updateResource as jest.MockedFunction< typeof updateResource >;
mockUpdateResource.mockImplementation((context: $TSContext, service: string, parameters?: Partial<MapParameters>): Promise<string> => {
    return new Promise<string>((resolve) => {
		resolve(service);
	});
});

jest.mock('amplify-cli-core');
jest.mock('../../../provider-utils/awscloudformation/index');


describe('update command tests', () => {
    const provider = 'awscloudformation';
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('update resource workflow is invoked for map service', async() => {
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

        let commandPath = path.normalize(path.join(__dirname, '..', '..', '..',  'commands', 'geo', 'update'));
        const commandModule = require(commandPath);
        await commandModule.run(mockContext);

        expect(mockUpdateResource).toHaveBeenCalledWith(mockContext, service);
    });
});