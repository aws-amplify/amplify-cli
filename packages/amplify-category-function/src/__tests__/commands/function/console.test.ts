import { run } from '../../../commands/function/console';
import { supportedServices } from '../../../provider-utils/supported-services';
jest.mock('../../../provider-utils/supported-services', () => ({
  supportedServices: {
    myMockService: {
      providerController: {
        openConsole: jest.fn(),
      },
    },
  },
}));

describe('open console', () => {
  it('calls open console', async () => {
    const contextStub = {
      amplify: {
        serviceSelectionPrompt: jest.fn(() => Promise.resolve({ service: 'myMockService' })),
      },
    };
    await run(contextStub);
    expect((supportedServices as any).myMockService.providerController.openConsole.mock.calls.length).toBe(1);
  });
});
