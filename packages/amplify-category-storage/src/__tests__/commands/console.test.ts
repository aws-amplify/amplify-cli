import { $TSContext, stateManager } from '@aws-amplify/amplify-cli-core';
import { Printer, printer } from '@aws-amplify/amplify-prompts';
import { run } from '../../commands/storage/console';
import * as providerController from '../../provider-utils/awscloudformation/index';

jest.mock('../../provider-utils/awscloudformation/index');
jest.mock('@aws-amplify/amplify-cli-core');
jest.mock('@aws-amplify/amplify-prompts');

const providerControllerMock = providerController as jest.Mocked<typeof providerController>;
const getMetaMock = stateManager.getMeta as jest.MockedFunction<typeof stateManager.getMeta>;
const printerMock = printer as jest.Mocked<Printer>;

describe('console command tests', () => {
  const provider = 'awscloudformation';
  let mockContext: $TSContext;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {
      amplify: {},
    } as unknown as $TSContext;
  });

  it('calls open console', async () => {
    const amplifyMetaMock = {
      storage: {
        TestTable: {
          service: 'DynamoDB',
          providerPlugin: 'awscloudformation',
        },
      },
    };
    getMetaMock.mockReturnValue(amplifyMetaMock);
    const service = 'DynamoDB';
    mockContext.amplify.serviceSelectionPrompt = jest.fn().mockImplementation(async () => ({ service, providerName: provider }));

    await run(mockContext);

    expect(providerControllerMock.console).toHaveBeenCalledWith(amplifyMetaMock, provider, service);
  });

  it('print error message when no resources in storage category', async () => {
    getMetaMock.mockReturnValue({});
    const service = 'DynamoDB';
    mockContext.amplify.serviceSelectionPrompt = jest.fn().mockImplementation(async () => ({ service, providerName: provider }));

    await run(mockContext);

    expect(printerMock.error).toBeCalledWith('Storage has NOT been added to this project.');
    expect(providerControllerMock.console).not.toBeCalled();
  });
});
